import csv

import requests


asns = requests.get("https://ftp.ripe.net/ripe/asnames/asn.txt")

with open("public/data/asn.csv", "w") as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=["code", "name"])
    writer.writeheader()

    lines = str(asns.text)
    for line in lines.split("\n"):
        line = line.strip()
        if not line:
            continue

        print(line)
        line = line.split(" ", maxsplit=1)
        writer.writerow({"code": line[0], "name": line[1]})
