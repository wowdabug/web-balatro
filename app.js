function $(id) {
    return document.getElementById(id);
}

async function getArrayBufferFromBlob(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
    });
}

async function getDataURIFromBlob(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    const build_button = $("parseBtn");
    const version_name_input = $("makeName");
    const progress_bar = $("progressBar");
    const status_text = $("status");

    async function loadHardcodedGame() {
        const url = "roms/mygame.exe"; // <-- your hardcoded file path
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to load hardcoded game file.");
        return await response.blob();
    }

    build_button.addEventListener("click", async () => {
        try {
            build_button.disabled = true;
            version_name_input.disabled = true;

            const file = await loadHardcodedGame();
            const name = version_name_input.value || "vanilla";

            status_text.innerText = "Building...";
            const game = await buildFromSource(file, {}); // no mods

            progress_bar.value = "95";
            status_text.innerText = "Saving to Cache";

            await saveGameToCache(game, name);

            progress_bar.value = "100";
            status_text.innerText = "Done";

            setTimeout(() => (progress_bar.value = "0"), 1000);
            await renderVersionList();
        } catch (err) {
            progress_bar.classList.add("hidden");
            showError(err instanceof Error ? err.message : String(err));
            console.error(err);
        } finally {
            build_button.disabled = false;
            version_name_input.disabled = false;
        }
    });

    try {
        await renderVersionList();
        status_text.innerText = "Ready";
    } catch (err) {
        showError(err.message);
    }
});
