function openGameDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("BalatroCacheDB", 1);

        request.onupgradeneeded = () => {
            request.result.createObjectStore("cache");
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function loadCachedGame() {
    const db = await openGameDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction("cache", "readonly");
        const store = tx.objectStore("cache");
        const getReq = store.get("game");

        getReq.onsuccess = () => resolve(getReq.result || null);
        getReq.onerror = () => reject(getReq.error);
    });
}

async function saveGameToCache(blob) {
    const db = await openGameDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction("cache", "readwrite");
        const store = tx.objectStore("cache");
        const putReq = store.put(blob, "game");

        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
    });
}
