function $(id) {
    return document.getElementById(id)
}

/**
 * 
 * @param {Blob | File} blob 
 * @returns {Promise<ArrayBuffer>}
 */
function getArrayBufferFromBlob(blob) {
    let resolve, reject, promise = new Promise((res, rej) => {resolve = res; reject = rej});
    const reader = new FileReader();
    reader.onload = function() {
        resolve(reader.result)
    };
    reader.onerror = function() {
        reject()
    }
    reader.readAsArrayBuffer(blob);
    return promise;
}

/**
 * 
 * @param {Blob | File} blob 
 * @returns {Promise<String>}
 */
function getDataURIFromBlob(blob) {
    let resolve, reject, promise = new Promise((res, rej) => {resolve = res; reject = rej});
    const reader = new FileReader();
    reader.onload = function() {
        resolve(reader.result)
    };
    reader.onerror = function() {
        reject()
    }
    reader.readAsDataURL(blob);
    return promise;
}

/** @type {Blob} .zip data of Balatro */
let game = null;

document.addEventListener("DOMContentLoaded", async () => {
    const file_input = document.getElementById("fileInput");
    const parse_button = document.getElementById("parseBtn");
    const parsing_progress = document.getElementById("progressBar");
    const run_button = document.getElementById("runBtn");
    const build_button = document.getElementById("buildBtn")
    const cachedGameInfo = document.getElementById("cachedGameInfo")

    // Try IndexedDB first
    try {
        game = await loadCachedGame();
        if (game instanceof Blob) {
            run_button.classList.remove("hidden");
            build_button.classList.remove("hidden")
            cachedGameInfo.classList.remove("hidden")
        }
    } catch (e) {
        console.warn("Failed to load from IndexedDB", e);
    } finally {
        $("checkingCacheInfo").classList.add("hidden")
    }

    parse_button.addEventListener("click", async function() {
        try {
            parse_button.disabled = true
            file_input.parentElement.classList.add("disabled")
            file_input.disabled = true;

            parsing_progress.classList.remove("hidden")
            parsing_progress.value = "0"
            const file = file_input.files[0]
            if (!file) throw new Error("No file inputted")
            const name = file.name
            if (!(name.endsWith(".exe") || name.endsWith(".love")))
                throw new Error("File doesn't end with '.exe' or '.love'. Aborting")

            const buffer = await getArrayBufferFromBlob(file)
            const reader = new BufferReader(buffer)

            while (true) {
                if (reader.string(4) === "PK\x03\x04") break
                reader.step(-3)
            }

            parsing_progress.value = "30"
            reader.step(-4)
            const pkfile = reader.bytes(reader.view.byteLength - reader.offset)
            parsing_progress.value = "40"

            const zipfile = await JSZip.loadAsync(new Blob([pkfile]))
            parsing_progress.value = "50"

            for (const patch_file of Object.keys(window.patches)) {
                zipfile.file(patch_file, window.patches[patch_file])
            }
            parsing_progress.value = "60"

            {
                const main = zipfile.file("main.lua")
                let contents = await main.async("string")
                contents = 'require "web_patches"\n' + contents
                contents = contents.replace("if os == 'OS X' or os == 'Windows' then", "if false then")
                zipfile.file("main.lua", contents)
            }

            parsing_progress.value = "70"

            {
                const contents = await zipfile.file("globals.lua").async("string")
                zipfile.file("globals.lua", contents.replace("F_SOUND_THREAD = true", "F_SOUND_THREAD = false"))
            }

            parsing_progress.value = "80"

            {
                const contents = await zipfile.folder("resources").folder("shaders").file("hologram.fs").async("string")
                zipfile.folder("resources").folder("shaders").file("hologram.fs", contents.replace(/glow_samples;/g, "4;"))
            }

            parsing_progress.value = "90"

            game = await zipfile.generateAsync({ type: "blob" })
            parsing_progress.value = "100"

            await saveGameToCache(game);

            run_button.classList.remove("hidden")
            build_button.classList.remove("hidden")
            
        } catch (err) {
            parsing_progress.classList.add("hidden")
            showError(err instanceof Error ? err.message : String(err))
        } finally {
            parse_button.disabled = false
            file_input.parentElement.classList.remove("disabled")
            file_input.disabled = false;
        }
    });

    run_button.addEventListener("click", async function() {
        document.body.innerHTML = ""
        const canvas = document.createElement("canvas")
        canvas.id = "canvas"
        document.body.appendChild(canvas)
        document.body.classList.add("game")
        if (!game) {
            showError("Game hasn't loaded yet")
            return;
        }

        const data = new Uint8Array(await game.arrayBuffer())

        Module = window.Module || {}
        Module.INITIAL_MEMORY = 268435456
        Module.canvas = canvas
        Module.printErr = console.error
        Module.arguments = ["game.love"] // 1st argument is the path of the package
        Module.preRun = [
            function () { // Load game.love into the fs
                Module.addRunDependency("fp game.love");
                var ptr = Module.getMemory(data.length);
                Module['HEAPU8'].set(data, ptr); // Put data after the chunk of memory
                Module.FS_createDataFile('/', "game.love", data, true, true, true); // Add the file
                Module.removeRunDependency("fp game.love");
            }
        ]
        // The package exports the Love function
        var s = document.createElement('script');
        s.type = 'text/javascript';
        s.src = "run/11.5/love.min.js";
        s.async = true;
        s.onload = function () {
            Love(Module);
        };
        document.body.appendChild(s);
    })
    build_button.addEventListener("click", function() {
        var s = document.createElement('script');
        s.type = 'text/javascript';
        s.src = "single_file.js"; // THICC FILE
        s.async = true;
        s.onload = async function () {
            const game_uri = await getDataURIFromBlob(game)

            const zip = new JSZip()
            for (const file_name of Object.keys(window.templates)) {
                zip.file(file_name, window.templates[file_name].replace("%%DATAURI%%", game_uri))
            }
            saveAs(await zip.generateAsync({type: "blob"}), "balatro.zip")
        };
        document.body.appendChild(s);
    })
})
