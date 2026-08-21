import uvicorn

if __name__ == "__main__":
    print("[*] Iniciando Servidor Backend FastAPI en http://127.0.0.1:8000 ...")
    print("[*] Documentacion Swagger interactiva disponible en: http://127.0.0.1:8000/api/v1/docs")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False)
