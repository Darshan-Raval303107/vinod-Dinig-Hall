import sys

# Force monkey-patching early to avoid RecursionError with SSL/Requests on Render/Gevent
try:
    import gevent.monkey
    gevent.monkey.patch_all(
        socket=True,
        dns=True,
        time=True,
        thread=True,
        os=False,
        select=True,
        ssl=True, # Critical fix for SSL recursion
        subprocess=False,
        sys=False,
        aggressive=False
    )
    sys.stderr.write("✅ Early Gevent monkey-patching applied successfully\n")
except ImportError:
    sys.stderr.write("⚠️ Gevent not found, skipping monkey-patching (Local/Dev mode)\n")
except Exception as e:
    sys.stderr.write(f"❌ Gevent monkey-patching failed: {str(e)}\n")
