#!/usr/bin/env python3
"""Prépare le petit répertoire public à partir du flux FINESS quotidien."""
import argparse
import csv
import datetime as dt
import gzip
import io
import json
import re
import urllib.request
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATASET = "https://www.data.gouv.fr/api/1/datasets/finess-structures-1/"
HEADERS = {"User-Agent": "Fluoxetine-France/1.0 (repertoire public FINESS)"}


def read_url(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=60).read()


def region_matches(lat, lng, postcode):
    boxes = {
        "971": (15.5, 18.4, -63.5, -60.8), "972": (14.2, 15.0, -61.4, -60.7),
        "973": (2.0, 5.95, -54.8, -51.4), "974": (-21.6, -20.7, 55.1, 55.95),
        "975": (46.6, 47.3, -56.6, -55.5), "976": (-13.1, -12.5, 44.9, 45.4),
    }
    south, north, west, east = boxes.get(postcode[:3], (41.2, 51.2, -5.6, 10.0))
    return south <= lat <= north and west <= lng <= east


def position(address):
    c = address.get("coordonneesGeographique") or {}
    for y, x in [("directionLatitude", "directionLongitude"), ("coordonneeY", "coordonneeX")]:
        try:
            lat, lng = float(c[y]), float(c[x])
            if region_matches(lat, lng, address["codePostal"]):
                return round(lat, 6), round(lng, 6)
        except (KeyError, ValueError, TypeError):
            pass
    return None, None


def clean_name(value):
    value = re.sub(r"^(?:SELARL|SELAS|SNC|SARL|EURL|SA|SELURL)\s+", "", value, flags=re.I).strip()
    # Les noms propres FINESS restent reconnaissables, sans inventer une enseigne.
    return value.title() if value.isupper() else value


def clean_phone(value):
    digits = re.sub(r"\D", "", value or "")
    return " ".join(digits[i:i+2] for i in range(0, 10, 2)) if re.fullmatch(r"0\d{9}", digits) else ""


def geocode_missing(pharmacies, cache_path, allow_remote=True):
    cache = json.loads(cache_path.read_text()) if cache_path.exists() else {}
    missing = [p for p in pharmacies if p["lat"] is None and p["id"] not in cache]
    # Les résultats ne sont réutilisés que si l'adresse FINESS est inchangée.
    for p in pharmacies:
        if p["id"] in cache and cache[p["id"]].get("address") != p["address"]:
            cache.pop(p["id"])
            if p["lat"] is None and p not in missing:
                missing.append(p)
    if missing and allow_remote:
        text = io.StringIO()
        writer = csv.writer(text)
        writer.writerow(["id", "address", "citycode", "postcode"])
        for p in missing:
            writer.writerow([p["id"], p["address"], p["citycode"], p["postcode"]])
        boundary = "fluoxetine-" + uuid.uuid4().hex
        parts = []
        for name, value in [("columns", "address"), ("indexes", "address"), ("citycode", "citycode"), ("postcode", "postcode")]:
            parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="data"; filename="pharmacies.csv"\r\nContent-Type: text/csv\r\n\r\n'.encode() + text.getvalue().encode() + b"\r\n")
        parts.append(f"--{boundary}--\r\n".encode())
        req = urllib.request.Request("https://data.geopf.fr/geocodage/search/csv", data=b"".join(parts), headers={**HEADERS, "Content-Type": "multipart/form-data; boundary=" + boundary})
        print(f"Géocodage IGN de {len(missing)} adresses…", flush=True)
        answer = urllib.request.urlopen(req, timeout=60).read().decode("utf-8-sig")
        review = ROOT.parent / "pharmacies_recherche/geocoding-review.csv"
        if review.parent.exists():
            review.write_text(answer)
        reader = csv.DictReader(io.StringIO(answer), delimiter=csv.Sniffer().sniff(answer[:4000]).delimiter)
        by_id = {p["id"]: p for p in missing}
        for row in reader:
            p = by_id.get(row.get("id"))
            if not p:
                continue
            try:
                lat, lng, score = float(row["latitude"]), float(row["longitude"]), float(row["result_score"])
                matched_city = row.get("result_citycode") == p["citycode"] or row.get("result_postcode") == p["postcode"]
                # Une commune seule n'est jamais publiée comme position de pharmacie.
                kind = row.get("result_type")
                usable = kind == "housenumber" or (kind == "street" and score >= 0.85)
                if score >= 0.75 and matched_city and usable and region_matches(lat, lng, p["postcode"]):
                    cache[p["id"]] = {"address": p["address"], "lat": round(lat, 6), "lng": round(lng, 6), "score": round(score, 3), "approximate": kind == "street"}
            except (KeyError, ValueError):
                pass
        cache_path.write_text(json.dumps(cache, ensure_ascii=False, separators=(",", ":")) + "\n")
    for p in pharmacies:
        c = cache.get(p["id"])
        if p["lat"] is None and c:
            p.update(lat=c["lat"], lng=c["lng"], positionSource="BAN / IGN", approximate=c.get("approximate", False))


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--active-source", type=Path, help="Extrait EGE actif déjà analysé, pour une reconstruction locale")
    ap.add_argument("--generated-at", help="Horodatage réel FINESS, obligatoire avec --active-source")
    ap.add_argument("--geocode", action="store_true", help="Compléter les positions absentes avec la BAN / IGN")
    args = ap.parse_args()
    if args.active_source:
        if not args.generated_at:
            ap.error("--generated-at est requis avec --active-source")
        eges = json.loads(args.active_source.read_text())
        generated_at = args.generated_at
        resource = "https://static.data.gouv.fr/resources/finess-structures-1/20261005-021926/finess-structures-journalier-20261005.json.gz"
    else:
        meta = json.loads(read_url(DATASET))
        resources = [r for r in meta["resources"] if "journalier" in r["url"] and r["url"].endswith(".json.gz")]
        resource = max(resources, key=lambda r: r.get("last_modified") or r.get("created_at") or "")["url"]
        doc = json.loads(gzip.decompress(read_url(resource)))
        generated_at = doc["generatedAt"]
        eges = [ege for p in doc["pmej"] for ege in p.get("ege", []) if ege.get("categorieentiteGeographiqueExercice") == "620" and ege.get("etatObjet") == "A"]
    pharmacies = []
    for e in eges:
        if e.get("categorieentiteGeographiqueExercice") != "620" or e.get("etatObjet") != "A":
            continue
        g = e["informationsGeneralesEGE"]
        a = next((a for a in e.get("adresse", []) if a.get("usageAdresse") == "03"), e["adresse"][0])
        lat, lng = position(a)
        street = a.get("ligneQuatre") or " ".join(str(a.get(k) or "") for k in ["numeroVoie", "typeVoie", "libelleVoie"]).strip() or a.get("complementVoie") or "Adresse à vérifier"
        city = a.get("ligneAcheminement") or "Commune à vérifier"
        p = {"id": g["numFinessEge"], "name": clean_name(g.get("nomEgeLong") or g["nomEgeCourt"]), "address": f'{street}, {a["codePostal"]} {city}', "postcode": a["codePostal"], "city": city, "citycode": a.get("cogCommune", ""), "phone": next((clean_phone(c.get("telecom", {}).get("telephone")) for c in e.get("contact", []) if clean_phone(c.get("telecom", {}).get("telephone"))), ""), "lat": lat, "lng": lng}
        if lat is not None:
            p["positionSource"] = "FINESS / BAN"
        if g.get("dateFermeture"):
            p["directoryWarning"] = "FINESS classe cette fiche active mais indique aussi une date de fermeture. Vérifiez auprès de la pharmacie."
        pharmacies.append(p)
    cache = ROOT / "data/geocoding-corrections.json"
    if args.geocode:
        geocode_missing(pharmacies, cache)
    else:
        geocode_missing(pharmacies, cache, allow_remote=False)
    historic_path = ROOT / "data/address-matched-finess-corrections.json"
    if historic_path.exists():
        historic = json.loads(historic_path.read_text())
        for p in pharmacies:
            c = historic.get(p["id"])
            if p["lat"] is None and c and c["address"] == p["address"] and region_matches(c["lat"], c["lng"], p["postcode"]):
                p.update(lat=c["lat"], lng=c["lng"], positionSource=c["positionSource"], approximate=True, positionWarning="Position FINESS du 4 mai 2026, adresse inchangée : emplacement à vérifier.")
    corrections_path = ROOT / "data/verified-corrections.json"
    if corrections_path.exists():
        corrections = json.loads(corrections_path.read_text())
        for p in pharmacies:
            c = corrections.get(p["id"])
            if c:
                for k in ["name", "phone", "lat", "lng"]:
                    if k in c:
                        p[k] = c[k]
                p["correctionSource"] = c["sourceUrl"]
    assert len(pharmacies) == len({p["id"] for p in pharmacies})
    assert len(pharmacies) > 15000, "Extrait anormalement petit : publication annulée"
    pharmacies.sort(key=lambda p: p["id"])
    metadata = {"generatedAt": generated_at, "preparedAt": dt.datetime.now(dt.timezone.utc).isoformat(), "source": "FINESS — Structures, catégorie 620, état A", "sourceUrl": "https://www.data.gouv.fr/datasets/finess-structures-1", "resourceUrl": resource, "license": "Licence Ouverte 2.0", "count": len(pharmacies), "located": sum(p["lat"] is not None for p in pharmacies), "missingPhone": sum(not p["phone"] for p in pharmacies), "missingPosition": sum(p["lat"] is None for p in pharmacies)}
    output = ROOT / "data/national.json"
    output.write_text(json.dumps({"metadata": metadata, "pharmacies": pharmacies}, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(json.dumps(metadata, ensure_ascii=False, indent=2), flush=True)
    print(f"Répertoire compact : {output.stat().st_size:,} octets", flush=True)


if __name__ == "__main__":
    main()
