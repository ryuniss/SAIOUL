"""
Fetch Figma images with new token at high quality.
Both files = same course (2025년 2학기 공간프로그램분석).
Final Exam images → scale=2 (clean design file)
Space Board images → scale=1 (FigJam board)
"""
import urllib.request, urllib.parse, json, os, time

TOKEN = "figd_fROOU28zpqwY0cgysj86WFlY8sRbK7RqwzoZ2Cd0"
OUT_DIR = "assets/images/students"
os.makedirs(OUT_DIR, exist_ok=True)

SPACE_KEY = "qvdgvlkWEbLSbpNCTvJ9pM"
FINAL_KEY = "awKUPNP6nebEJutetxC8Z9"

SPACE_STUDENTS = [
    ("45:1494","이윤규"),("45:1492","이대형"),("45:1493","정예빈"),
    ("45:1495","김다연"),("45:1496","송서현"),("45:1498","주현지"),
    ("45:1497","송하링"),("45:1499","백혁"),  ("45:1500","최지혜"),
    ("45:1501","김규리"),("45:1502","양유정"),("45:1503","김효리"),
    ("45:1505","안정은"),("45:1506","김도훈"),("45:1507","이민석"),
    ("45:1508","정지원"),("45:1509","심예빈"),("45:1504","조예나"),
    ("45:1510","서채린"),("45:1511","이승하"),("45:1512","이정은"),
    ("45:1513","김가인"),
]
FINAL_STUDENTS = [
    ("1:931","이윤규"), ("1:1623","이대형"),("1:1934","정예빈"),
    ("1:2245","김다연"),("1:2556","송서현"),("1:2867","주현지"),
    ("1:3178","송하린"),("1:3489","백혁"),  ("1:3800","최지혜"),
    ("1:4111","김규리"),("1:6599","조예나"),("1:4422","양유정"),
    ("1:4733","김효리"),("1:5044","안정은"),("1:5355","김도훈"),
    ("1:5666","이민석"),("1:5977","정지원"),("1:6288","심예빈"),
    ("1:6910","서채린"),("1:7221","이승하"),("1:7532","이정은"),
    ("1:7843","김가인"),
]

def api(url):
    req = urllib.request.Request(url, headers={"X-Figma-Token": TOKEN})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.loads(r.read())

def dl(url, path):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    open(path, "wb").write(data)
    return len(data)

def get_child_ids(file_key, page_ids):
    """Return {page_name: first_child_id} by fetching file structure."""
    ids_str = ",".join(nid for nid, _ in page_ids)
    data = api(f"https://api.figma.com/v1/files/{file_key}?ids={urllib.parse.quote(ids_str)}&depth=2")
    result = {}
    for page in data["document"]["children"]:
        children = page.get("children", [])
        if children:
            result[page["name"]] = children[0]["id"]
    return result

def fetch_batch(file_key, id_name_pairs, scale, prefix, force=False):
    """Render a batch and download. Returns list of (name, path|None)."""
    results = []
    # Get child IDs first
    print(f"  Getting child IDs for {len(id_name_pairs)} pages…")
    child_map = get_child_ids(file_key, id_name_pairs)

    # Batch render 4 at a time
    BATCH = 4
    all_img_urls = {}
    node_to_name = {}
    for page_id, name in id_name_pairs:
        cid = child_map.get(name)
        if cid:
            node_to_name[cid] = name

    node_pairs = list(node_to_name.items())  # [(child_id, name)]
    for i in range(0, len(node_pairs), BATCH):
        batch = node_pairs[i:i+BATCH]
        ids_str = ",".join(cid for cid, _ in batch)
        names = [nm for _, nm in batch]
        print(f"  Rendering {names}…", end=" ", flush=True)
        try:
            resp = api(f"https://api.figma.com/v1/images/{file_key}?ids={urllib.parse.quote(ids_str)}&format=png&scale={scale}")
            imgs = resp.get("images", {})
            print(f"→ {len(imgs)} URLs")
            all_img_urls.update(imgs)
        except Exception as e:
            print(f"✗ {e}")
        time.sleep(1.5)

    # Download
    for cid, name in node_pairs:
        img_url = all_img_urls.get(cid)
        fname = f"{prefix}_{name}.png"
        fpath = os.path.join(OUT_DIR, fname)

        if not img_url:
            print(f"  ⚠ No URL for {name}")
            results.append((name, None))
            continue

        try:
            size = dl(img_url, fpath)
            # Check for suspiciously small files (< 20KB = likely blank)
            if size < 20000:
                print(f"  ⚠ {name} too small ({size//1024}KB), keeping but flagging")
            else:
                print(f"  ✓ {name} → {size//1024}KB")
            results.append((name, fname))
        except Exception as e:
            print(f"  ✗ {name}: {e}")
            results.append((name, None))

    return results

print("=" * 55)
print("FINAL EXAM (Design file) — scale=2")
print("=" * 55)
final_results = fetch_batch(FINAL_KEY, FINAL_STUDENTS, scale=2, prefix="final", force=True)

print()
print("=" * 55)
print("SPACE BOARD (FigJam) — scale=1")
print("=" * 55)
space_results = fetch_batch(SPACE_KEY, SPACE_STUDENTS, scale=1, prefix="space", force=True)

# Build manifest
manifest = {}
for name, path in final_results:
    if name not in manifest:
        manifest[name] = {}
    manifest[name]["final"] = path

for name, path in space_results:
    if name not in manifest:
        manifest[name] = {}
    manifest[name]["space"] = path

with open("figma_data.json", "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

ok = sum(1 for v in manifest.values() if v.get("final") or v.get("space"))
print(f"\n✓ Done — {ok} students with images")
print("→ figma_data.json written")
