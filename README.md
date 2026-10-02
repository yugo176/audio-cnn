# 🎧 Audio CNN — Visualiseur

Un réseau de neurones convolutif qui **reconnaît les sons du quotidien** (chien, pluie, sirène, oiseaux… 50 classes) et une interface web qui montre **ce que le réseau « voit »** à chaque couche.

## Comment ça marche

```
Son (WAV, MP3, micro…)  →  Spectrogramme Mel  →  ResNet-34  →  Top 5 des prédictions
```

1. **Le son devient une image** : un spectrogramme Mel (128 bandes de fréquence × temps).
2. **Un ResNet-34** entraîné sur [ESC-50](https://github.com/karolpiczak/ESC-50) (2 000 clips, 50 classes) analyse cette image.
3. **L'interface affiche** les prédictions, la forme d'onde, le spectrogramme et les activations de chaque couche du réseau.

## Fonctionnalités

- 🧠 CNN de type ResNet-34 avec blocs résiduels, écrit avec PyTorch
- 🎛️ Entraînement avec Mixup, SpecAugment (masquage temps / fréquence), AdamW et OneCycleLR
- ☁️ Inférence serverless sur [Modal](https://modal.com), exposée en API FastAPI
- 🎙️ Enregistrement direct au micro, ou glisser-déposer d'un fichier (WAV, MP3, M4A, OGG…)
- 🔊 Lecteur audio synchronisé avec la forme d'onde
- 👁️ Visualisation des feature maps de toutes les couches (rendu canvas)
- 🎨 Interface sombre en français — Next.js, React, Tailwind CSS
- 🔒 Prêt pour le public : limite de requêtes par IP, limite de taille et de durée, aucun son conservé

## Structure

```
.
├── model.py                  # Architecture AudioCNN (ResNet-34)
├── train.py                  # Entraînement sur Modal (GPU)
├── train_colab.ipynb         # Entraînement alternatif sur Google Colab (GPU T4 gratuit)
├── main.py                   # API d'inférence déployée sur Modal
├── requirements.txt
└── audio-cnn-visualisation/  # Frontend Next.js
```

## Installation

### Prérequis

- Python 3.11+
- Node.js 20+
- Un compte [Modal](https://modal.com)

### Backend

```bash
python -m venv .venv
.venv\Scripts\activate        # Windows  (macOS/Linux : source .venv/bin/activate)
pip install -r requirements.txt
modal setup
```

### Entraîner le modèle

Le modèle est enregistré dans le volume Modal `esc-model` sous `best_model.pth`.

**Option 1 — sur Modal** (nécessite un moyen de paiement pour les GPU) :

```bash
modal run --detach train.py
```

**Option 2 — sur Google Colab** (gratuit) : ouvrir `train_colab.ipynb`, choisir un GPU T4, tout exécuter, puis envoyer le modèle sur Modal :

```bash
modal volume put esc-model best_model.pth /best_model.pth
```

### Déployer l'API

```bash
modal deploy main.py
```

Modal affiche l'URL de l'endpoint (`https://<workspace>--audio-cnn-inference-audioclassifier-inference.modal.run`).

### Frontend

```bash
cd audio-cnn-visualisation
npm install
cp .env.example .env          # puis renseigner NEXT_PUBLIC_INFERENCE_URL
npm run dev
```

L'application est disponible sur http://localhost:3000.

## API

`POST /` avec un corps JSON :

```json
{ "audio_data": "<fichier audio encodé en base64>" }
```

Réponse : `predictions` (top 5 avec confiance), `visualization` (activations par couche), `input_spectrogram` et `waveform`.

| Code | Signification |
|------|---------------|
| 200 | Analyse réussie |
| 400 | Fichier audio illisible |
| 413 | Fichier trop volumineux |
| 429 | Trop de requêtes (10 / min, 150 / jour par IP) |

Seules les 10 premières secondes de chaque son sont analysées.

## Déploiement du frontend

Sur [Vercel](https://vercel.com) : importer le dépôt, choisir `audio-cnn-visualisation` comme *Root Directory* et définir la variable `NEXT_PUBLIC_INFERENCE_URL`.

## Licence

MIT — voir [LICENSE.MD](LICENSE.MD).
