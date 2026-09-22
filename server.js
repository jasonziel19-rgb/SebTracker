const express = require('express');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Serves any file sitting next to this one — map.png included — at its
// own filename (e.g. /map.png). Without this, only the explicit routes
// below (like '/') are reachable and everything else 404s.
app.use(express.static(__dirname));

// index.html lives right next to this file (repo root), not in a
// separate "public" folder — so we serve it directly from __dirname.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/healthz', (req, res) => res.json({ ok: true }));

const TWO_HOURS = 2 * 60 * 60 * 1000;

// In-memory store. Fine for this use case (reports are meant to expire
// after 2 hours anyway) but note: a Render free-tier instance that spins
// down on inactivity will lose this data on restart. See README if you
// want it to survive restarts.
let reports = [];

function pruneExpired() {
  const now = Date.now();
  reports = reports.filter((r) => now - r.createdAt < TWO_HOURS);
}

app.get('/api/reports', (req, res) => {
  pruneExpired();
  res.json(reports);
});

app.post('/api/reports', (req, res) => {
  pruneExpired();
  const body = req.body || {};

  const description = typeof body.description === 'string' ? body.description.trim().slice(0, 400) : '';
  const location = typeof body.location === 'string' ? body.location.trim().slice(0, 140) : '';
  const pin = body.pin && typeof body.pin.x === 'number' && typeof body.pin.y === 'number'
    ? { x: Math.min(1, Math.max(0, body.pin.x)), y: Math.min(1, Math.max(0, body.pin.y)) }
    : null;

  if (!description && !location && !pin) {
    return res.status(400).json({ error: 'Add a location, a landmark, or a short description.' });
  }

  const report = {
    id: crypto.randomUUID(),
    description: description || null,
    location: location || null,
    pin,
    createdAt: Date.now()
  };

  reports.push(report);
  res.status(201).json(report);
});

// Lets a client remove its own previous pin before placing a new one.
// Anyone who knows an id can delete it (there's no auth in this app),
// but ids aren't guessable and aren't shown anywhere, so this is fine
// for "swap my own pin" — not a real permissions system.
app.delete('/api/reports/:id', (req, res) => {
  const before = reports.length;
  reports = reports.filter((r) => r.id !== req.params.id);
  res.json({ deleted: reports.length !== before });
});

// Background sweep so expired reports don't linger in memory between requests.
setInterval(pruneExpired, 5 * 60 * 1000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Perimeter Watch listening on port ${PORT}`);
});
