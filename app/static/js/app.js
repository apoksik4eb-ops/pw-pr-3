const uploadBtn = document.getElementById("upload");
const fileInput = document.getElementById("fileInput");
const upActions = document.getElementById("upActions");
const upSend = document.getElementById("upSend");
const upDelete = document.getElementById("upDelete");
const uploadMusic = document.getElementById("uploadMusic");
const transcriptionBody = document.getElementById("transcriptionBody");
const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");
// ---
const record = document.getElementById("record");
const recTimer = document.getElementById("recTimer");
const recAudio = document.getElementById("recAudio");
const recActions = document.getElementById("recActions");
const recSend = document.getElementById("recSend");
const recDelete = document.getElementById("recDelete");

let uploadedFile;

function formatBytes(bytes) {
    if(bytes < 1024) return bytes + "B";
    if(bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "KB";
    return (bytes / (1024 * 1024)).toFixed(2) + "MB";
};

function setTranscript(text) {
    if(text) {
        transcriptionBody.textContent = text;
        transcriptionBody.className = "border border-[#e5e5e5] bg-[#fafafa] min-h-[88px] rounded-lg p-4 text-left text-xs text-black whitespace-pre-wrap"
    } else {
        transcriptionBody.textContent = "Текст появится здесь после распознавания аудио";
        transcriptionBody.className = "border border-[#e5e5e5] bg-[#fafafa] min-h-[88px] rounded-lg p-4 flex items-center justify-center text-center text-xs text-[#737373]"
    }
}

uploadBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];

    if(!file) return;

    uploadedFile = file;

    fileName.textContent = file.name;
    fileSize.textContent = formatBytes(file.size);

    uploadMusic.hidden = false;
    upActions.hidden = false;
});

upSend.addEventListener("click", () => {
    if(uploadedFile) {
        upSend.disabled = true;
        sendFile(uploadedFile);
    }
});

upDelete.addEventListener("click", () => {
    uploadedFile = undefined;
    fileInput.value = "";
    upActions.hidden = true;
});

function sendFile(file, filename) {
    const formData = new FormData();
    formData.append("audio", file, filename);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/voice/upload", true);

    xhr.upload.onprogress = (event) => {
        if(event.lengthComputable) {
            const percent = Math.round(
                (event.loaded / event.total) * 100
            );

            console.log(`Загружено: ${percent}`)
        }
    };

    xhr.onload = () => {
        if(xhr.status >= 200 && xhr.status < 300) {
            console.log(`Успех:`, JSON.parse(xhr.responseText));
            setTranscript(JSON.parse(xhr.responseText).text)
        } else {
            console.log("Ошибка сервера:", xhr.status);
        }

        upSend.disabled = false;
    }

    xhr.onerror = () => {
        console.log("Ошибка сети");
        upSend.disabled = false;
    };

    xhr.send(formData);
};

let recorder, chunks = [], recordedBlob = null, timerId = null, startedAt = 0, recording = false;

function startRecording() {
    try {
        stream = navigator.mediaDevices.getUserMedia({ audio: true });
    } catch(e) {
        console.error(e);
        return;
    }

    recorder = new MediaRecorder(stream);
    chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
        recordedBlob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        recAudio.src = URL.createObjectURL(recordedBlob);
        recAudio.hidden = false;
        recActions.hidden = false;
        stream.getTracks().forEach(t => t.stop());
    };

    recorder.start()

    recording = true;
    // recordIcon.className = "ph-fill ph-stop";
    recAudio.hidden = true;
    recActions.hidden = true;
    startedAt = Date.now();
    timerId = setInterval(() => { recTimer.textContent = formatTime((Date.now() - startedAt) / 1000) }, 250)
}

function stopRecording() {
    recorder.stop();
    recording = false;
    clearInterval(timerId);
}

record.addEventListener("click", () => recording ? stopRecording() : startRecording());
recSend.addEventListener("click", () => {
    if(recordedBlob) sendFile(recordedBlob, `recording_${Date.now()}.webm`);
});
recDelete.addEventListener("click", () => {
    recordedBlob = null;
    recAudio.hidden = true;
    recAudio.src = "";
    recActions.hidden = null;
    recTimer.textContent = "00:00";
});

function formatTime(sec) {
    sec = Math.max(0, Math.floor(sec));
    return String(Math.floor(sec / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0");
}