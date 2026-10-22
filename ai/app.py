import io
import os
from fastapi import FastAPI, HTTPException, Request
from PIL import Image, UnidentifiedImageError
from transformers import pipeline

app = FastAPI(title='TanodBukid plant scanner')
model = None
MODEL_ID = os.getenv('MODEL_ID', 'neghani/plantvillage-mobilenetv2')

@app.get('/health')
def health():
    return {'status':'ok', 'model_loaded':model is not None, 'model':MODEL_ID}

@app.post('/predict')
async def predict(request: Request):
    global model
    raw = await request.body()
    if len(raw) > 8 * 1024 * 1024:
        raise HTTPException(413, 'Photo exceeds 8 MB')
    try:
        im = Image.open(io.BytesIO(raw))
        im.verify()
        im = Image.open(io.BytesIO(raw)).convert('RGB')
        if im.width * im.height > 24_000_000:
            raise HTTPException(413, 'Image resolution is too large')
    except (UnidentifiedImageError, OSError, ValueError):
        raise HTTPException(415, 'Not a supported image')
    try:
        if model is None:
            model = pipeline('image-classification', model=MODEL_ID, device=-1)
        preds = model(im, top_k=3)
    except Exception:
        raise HTTPException(503, 'AI model could not load. Check the ai container logs.')
    top = preds[0]
    score = float(top['score'])
    label = str(top['label'])
    parts = label.split('___', 1)
    crop = parts[0].replace('_', ' ') if len(parts) == 2 else 'Unknown'
    condition = parts[1].replace('_', ' ') if len(parts) == 2 else label.replace('_', ' ')
    return {'supported':score >= 0.7, 'crop':crop, 'condition':condition, 'confidence':round(score, 4),
            'label':label, 'alternatives':[{'label':str(x['label']), 'confidence':round(float(x['score']),4)} for x in preds],
            'notice':'Experimental leaf-image classification only. Results may be wrong for field photos, unsupported crops, pests or mixed diseases. Confirm with an agricultural specialist.'}
