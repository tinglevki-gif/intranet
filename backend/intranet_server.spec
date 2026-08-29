# -*- mode: python ; coding: utf-8 -*-
import os
import sys

block_cipher = None

backend_dir = os.path.abspath(SPECPATH)

added_datas = [
    (os.path.join(backend_dir, 'frontend_dist'), 'frontend_dist'),
    (os.path.join(backend_dir, 'uploads'), 'uploads'),
]

if os.path.exists(os.path.join(backend_dir, 'intranet.db')):
    added_datas.append((os.path.join(backend_dir, 'intranet.db'), '.'))

hidden_imports = [
    'uvicorn',
    'uvicorn.logging',
    'uvicorn.loops',
    'uvicorn.loops.auto',
    'uvicorn.protocols',
    'uvicorn.protocols.http',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.http.h11_impl',
    'uvicorn.protocols.http.httptools_impl',
    'uvicorn.protocols.websockets',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.lifespans',
    'uvicorn.lifespans.auto',
    'uvicorn.lifespans.on',
    'uvicorn.lifespans.off',
    'sqlalchemy.dialects.sqlite',
    'sqlalchemy.dialects.sqlite.pysqlite',
    'sqlalchemy.dialects.postgresql',
    'passlib.handlers.bcrypt',
    'pytesseract',
    'pdf2image',
    'PIL',
    'PIL.Image',
    'pydantic',
    'pydantic_settings',
    'multipart',
    'python_multipart',
    'starlette',
    'starlette.staticfiles',
    'starlette.middleware',
    'starlette.middleware.cors',
    'jose',
    'bcrypt',
    'email_validator',
    'app',
    'app.main',
    'app.core',
    'app.core.config',
    'app.core.security',
    'app.db',
    'app.db.base_class',
    'app.db.session',
    'app.models',
    'app.schemas',
    'app.services',
    'app.api',
    'app.api.v1',
    'app.api.v1.api',
]

a = Analysis(
    ['run_app.py'],
    pathex=[backend_dir],
    binaries=[],
    datas=added_datas,
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'scipy', 'pandas'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='TiglevIntranetServer',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='TiglevIntranetServer',
)
