import L from 'leaflet';
import StoryApi from '../../data/api';
import { getUserToken } from '../../utils/auth';
import StoryDb from '../../utils/db';

export default class AddPage {
    constructor() {
        this._map = null;
        this._marker = null;

        this._mediaStream = null;
        this._snappedPhotoFile = null;
    }

    async render() {
        return `
      <section class="container">
        <div class="add-story-page">
          <h1>Tambah Story Baru</h1>
          <form id="add-story-form" class="add-story-form">
            
            <div class="form-group" id="photo-input-group">
              <label for="photo-upload">Upload Foto (Max 1MB)</label>
              <input type="file" id="photo-upload" name="photo" accept="image/*">
              <button type="button" id="open-camera-button" class="button-secondary">
                Gunakan Kamera
              </button>
            </div>

            <div id="camera-container" style="display: none;">
              <video id="camera-feed" autoplay playsinline></video>
              <div class="camera-controls">
                <button type="button" id="snap-button" class="button-primary">Jepret Foto</button>
                <button type="button" id="cancel-camera-button" class="button-secondary">Batal</button>
              </div>
              <canvas id="photo-canvas" style="display: none;"></canvas>
            </div>
            
            <div class="form-group">
              <img id="preview-image" src="#" alt="Image preview" style="display: none; max-width: 100%; margin-top: 10px;"/>
            </div>

            <div class="form-group">
              <label for="description-input">Deskripsi</label>
              <textarea id="description-input" name="description" rows="5" required></textarea>
            </div>

            <p>Pilih Lokasi (Klik di Peta):</p>
            <div id="add-map" style="height: 300px; width: 100%; margin-bottom: 15px;"></div>

            <label for="lat-input" class="visually-hidden">Latitude</label>
            <input type="hidden" name="lat" id="lat-input" readonly>
            
            <label for="lon-input" class="visually-hidden">Longitude</label>
            <input type="hidden" name="lon" id="lon-input" readonly>
            <button type="submit" class="button-primary">Upload Story</button>
          </form>
          <p id="error-message" class="error-message"></p>
        </div>
      </section>
    `;
    }

    async afterRender() {
        // Inisialisasi Peta (Kode Lama)
        this._map = L.map('add-map').setView([-6.200000, 106.816666], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this._map);

        const latInput = document.getElementById('lat-input');
        const lonInput = document.getElementById('lon-input');

        this._map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            latInput.value = lat;
            lonInput.value = lng;
            if (this._marker) {
                this._map.removeLayer(this._marker);
            }
            this._marker = L.marker([lat, lng]).addTo(this._map)
                .bindPopup('Lokasi dipilih').openPopup();
        });


        const photoInput = document.getElementById('photo-upload');
        const previewImage = document.getElementById('preview-image');

        // Elemen UI Kamera
        const openCameraButton = document.getElementById('open-camera-button');
        const cameraContainer = document.getElementById('camera-container');
        const videoFeed = document.getElementById('camera-feed');
        const snapButton = document.getElementById('snap-button');
        const cancelButton = document.getElementById('cancel-camera-button');
        const photoCanvas = document.getElementById('photo-canvas');
        const photoInputGroup = document.getElementById('photo-input-group');

        // Eventmemilih file dari galeri
        photoInput.addEventListener('change', () => {
            this._snappedPhotoFile = null;
            const file = photoInput.files[0];
            if (file) {
                previewImage.src = URL.createObjectURL(file);
                previewImage.style.display = 'block';
            }
        });

        // Event"Gunakan Kamera"
        openCameraButton.addEventListener('click', async () => {
            try {
                await this._initCamera(videoFeed);
                cameraContainer.style.display = 'block';
                photoInputGroup.style.display = 'none';
                previewImage.style.display = 'none';
            } catch (error) {
                console.error(error);
                alert(`Gagal membuka kamera: ${error.message}`);
            }
        });

        // Event "Batal" dari kamera
        cancelButton.addEventListener('click', () => {
            this._stopCameraStream();
            cameraContainer.style.display = 'none';
            photoInputGroup.style.display = 'block';
        });

        // Event:Jepret Foto"
        snapButton.addEventListener('click', () => {
            photoCanvas.width = videoFeed.videoWidth;
            photoCanvas.height = videoFeed.videoHeight;
            const context = photoCanvas.getContext('2d');
            context.drawImage(videoFeed, 0, 0, videoFeed.videoWidth, videoFeed.videoHeight);

            photoCanvas.toBlob((blob) => {
                this._snappedPhotoFile = new File([blob], "camera-shot.jpg", { type: "image/jpeg" });

                previewImage.src = URL.createObjectURL(this._snappedPhotoFile);
                previewImage.style.display = 'block';

                photoInput.value = '';

                this._stopCameraStream();
                cameraContainer.style.display = 'none';
                photoInputGroup.style.display = 'block';

            }, 'image/jpeg');
        });


        const addStoryForm = document.getElementById('add-story-form');
        const errorMessage = document.getElementById('error-message');

        addStoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMessage.textContent = '';
            const submitButton = addStoryForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Uploading...';

            // Validasi Lokasi (Kode asli Anda)
            if (!latInput.value || !lonInput.value) {
                errorMessage.textContent = 'Silakan pilih lokasi di peta terlebih dahulu.';
                submitButton.disabled = false;
                submitButton.textContent = 'Upload Story';
                return;
            }

            // Logika pengambilan file (Kode asli Anda)
            const fileFromInput = photoInput.files[0];
            const fileFromCamera = this._snappedPhotoFile;
            let photoFile = null;
            if (fileFromCamera) {
                photoFile = fileFromCamera;
            } else if (fileFromInput) {
                photoFile = fileFromInput;
            }

            // Validasi file (Kode asli Anda)
            if (!photoFile) {
                errorMessage.textContent = 'Foto wajib diisi. Silakan upload atau ambil dari kamera.';
                submitButton.disabled = false;
                submitButton.textContent = 'Upload Story';
                return;
            }
            if (photoFile.size > 1000000) {
                errorMessage.textContent = 'Ukuran file terlalu besar. Maksimal 1MB.';
                submitButton.disabled = false;
                submitButton.textContent = 'Upload Story';
                return;
            }

            // Ambil data lain dari form
            const description = document.getElementById('description-input').value;
            const token = getUserToken();

            try {
                const formData = new FormData();
                formData.append('photo', photoFile);
                formData.append('description', description);
                formData.append('lat', latInput.value);
                formData.append('lon', lonInput.value);

                const response = await StoryApi.addNewStory(token, formData);
                if (response.error) {
                    throw new Error(response.message); 
                }

                // Berhasil online
                console.log('Story berhasil di-upload (online)');
                alert('Story berhasil di-upload!');
                window.location.hash = '#/';

            } catch (error) {
                // --- (OFFLINE) ---
                console.error('Upload gagal (mungkin offline), menyimpan ke outbox...', error.message);

                try {
                    // Buat object data untuk disimpan (FormData TIDAK bisa ke IDB)
                    const storyData = {
                        photo: photoFile, 
                        description: description,
                        lat: latInput.value,
                        lon: lonInput.value,
                    };

                    //  Simpan ke IndexedDB
                    await StoryDb.addStoryToOutbox(storyData);
                    console.log('Story disimpan ke outbox');

                    // Minta Background Sync
                    if ('serviceWorker' in navigator && 'SyncManager' in window) {
                        const swRegistration = await navigator.serviceWorker.ready;
                        // Daftarkan tag 'sync-new-stories'
                        await swRegistration.sync.register('sync-new-stories');
                        console.log('Background Sync terdaftar');

                        // Beri tahu user dan redirect
                        alert('Anda sedang offline. Story disimpan dan akan di-upload saat koneksi kembali.');
                        window.location.hash = '#/';
                    } else {
                        throw new Error('Background Sync tidak didukung oleh browser ini.');
                    }

                } catch (dbError) {
                    // Gagal menyimpan ke IDB
                    console.error('Gagal menyimpan story ke outbox:', dbError);
                    errorMessage.textContent = `Upload Gagal (Online): ${error.message}. Gagal menyimpan (Offline): ${dbError.message}`;
                    submitButton.disabled = false;
                    submitButton.textContent = 'Upload Story';
                }
            }
        });
    }

    // inisialisasi kamera 
    async _initCamera(videoElement) {
        if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
            this._stopCameraStream();

            // Minta akses kamera
            const constraints = {
                video: {
                    facingMode: 'environment'
                },
                audio: false
            };

            this._mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            videoElement.srcObject = this._mediaStream;
            videoElement.play();
        } else {
            throw new Error('Kamera tidak didukung di browser ini.');
        }
    }

    _stopCameraStream() {
        if (this._mediaStream) {
            this._mediaStream.getTracks().forEach(track => track.stop());
            this._mediaStream = null;
        }
    }
}