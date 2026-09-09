const html = await (await fetch("https://vimeos.net/d/0aqpm07mnw2j_h", {
  headers: { Referer: "https://vimeos.net/embed-0aqpm07mnw2j.html", "User-Agent": "Mozilla/5.0" },
})).text();

const ops = [...html.matchAll(/op=[a-zA-Z_]+/g)].map((m) => m[0]);
console.log("ops", [...new Set(ops)]);

const dlPatterns = [...html.matchAll(/download[^"'\s]{0,80}/gi)].slice(0, 10);
console.log("download patterns", dlPatterns.map((m) => m[0]));

// Try vimeos download API patterns
const tests = [
  "https://vimeos.net/?op=download&id=65569",
  "https://vimeos.net/?op=download&id=0aqpm07mnw2j",
  "https://vimeos.net/dl?op=download&id=65569",
  "https://vimeos.net/dl/0aqpm07mnw2j/1080p.mp4",
  "https://s1.vimeos.net/d/0aqpm07mnw2j/1080p.mp4",
  "https://s1.vimeos.net/dl/0aqpm07mnw2j/1080p.mp4",
  "https://s1.vimeos.net/i/02/00013/0aqpm07mnw2j.mp4",
];

for (const url of tests) {
  const res = await fetch(url, {
    redirect: "manual",
    headers: { Referer: "https://vimeos.net/", "User-Agent": "Mozilla/5.0" },
  });
  console.log(url, res.status, res.headers.get("location"), res.headers.get("content-type"));
}
