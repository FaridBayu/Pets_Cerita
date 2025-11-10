import L from "leaflet";
import StoryApi from "../../data/api";
import { getUserToken } from "../../utils/auth";
import { showFormattedDate } from "../../utils";
import StoryDb from "../../utils/db";

function storiesToGeoJSON(stories) {
  const features = stories
    .filter((story) => story.lat != null && story.lon != null)
    .map((story) => {
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [story.lon, story.lat],
        },
        properties: {
          id: story.id,
          name: story.name,
          description: story.description,
          photoUrl: story.photoUrl,
          createdAt: story.createdAt,
        },
      };
    });

  return {
    type: "FeatureCollection",
    features: features,
  };
}

export default class HomePage {
  constructor() {
    this._map = null;
    this._storyMarkers = {};
  }

  async render() {
    return `
      <section class="container">
        <div class="home-header">
          <h1>Peta Cerita</h1>
          <a href="#/add" class="button-primary">Tambah Story Baru</a>
        </div>
        
        <div id="map" class="story-map"></div>

        <h2>Daftar Cerita</h2>
        
        <div id="story-list" class="story-list">
          <p>Memuat cerita...</p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const worldBounds = L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180));

    this._map = L.map("map", {
      minZoom: 2,
      maxBounds: worldBounds,
      maxBoundsViscosity: 1.0,
    }).setView([-2.5489, 118.0149], 5);

    const osmLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        noWrap: true,
        bounds: worldBounds,
      }
    );

    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles &copy; Esri",
        noWrap: true,
        bounds: worldBounds,
      }
    );

    osmLayer.addTo(this._map);

    const baseMaps = {
      Street: osmLayer,
      Satellite: satelliteLayer,
    };

    L.control.layers(baseMaps).addTo(this._map);

    const storyListContainer = document.getElementById("story-list");
    this._storyMarkers = {};

    try {
      console.log("Mencoba mengambil cerita dari network...");
      const token = getUserToken();
      const response = await StoryApi.getAllStories(token);
      if (response.error) {
        throw new Error(response.message);
      }

      const stories = response.listStory;

      // SAAT ONLINE: Simpan ke IndexedDB
      await StoryDb.putStories(stories);
      console.log("Data dari network dan disimpan ke IDB.");

      // Panggil fungsi render yang baru
      this._renderPageContent(stories, storyListContainer);
    } catch (error) {
      // SAAT OFFLINE (FALLBACK)
      console.error("Gagal mengambil dari network:", error.message);
      console.log("Mencoba memuat cerita dari IndexedDB...");

      try {
        // Ambil dari IndexedDB
        const stories = await StoryDb.getAllStories();

        if (stories.length > 0) {
          console.log("Berhasil memuat cerita dari IndexedDB.");
          // Panggil fungsi render yang baru
          this._renderPageContent(stories, storyListContainer);
        } else {
          // IDB kosong
          throw new Error("Tidak ada cerita di IndexedDB.");
        }
      } catch (dbError) {
        // Gagal total
        console.error("Gagal memuat dari IndexedDB:", dbError);
        storyListContainer.innerHTML = `<p class="error-message">Gagal memuat data (offline): ${dbError.message}</p>`;
      }
    }
  }

  _activateStory(storyId, lat, lon) {
    if (!storyId || !lat || !lon) return;

    const marker = this._storyMarkers[storyId];
    if (!marker) return;

    this._map.flyTo([parseFloat(lat), parseFloat(lon)], 15);

    setTimeout(() => {
      marker.openPopup();
    }, 800);
  }

  _renderPageContent(stories, storyListContainer) {
    storyListContainer.innerHTML = "";
    stories.forEach((story) => {
      const storyItem = document.createElement("article");
      storyItem.classList.add("story-item");

      if (story.lat && story.lon) {
        storyItem.dataset.story = JSON.stringify(story);
        storyItem.dataset.storyId = story.id;
        storyItem.dataset.lat = story.lat;
        storyItem.dataset.lon = story.lon;
        storyItem.setAttribute("tabindex", "0");
      }

      storyItem.innerHTML = `
        <img src="${story.photoUrl}" alt="Foto cerita oleh ${story.name}" class="story-image">
        <div class="story-content">
          <h3 class="story-name">${story.name}</h3>
          <p class="story-date">${showFormattedDate(story.createdAt)}</p>
          <p class="story-description">${story.description.substring(0, 150)}...</p>
          <button class="button-secondary button-save-favorite" style="margin-top: 10px; width: 100%;">
            Simpan ke Favorit
          </button>
          
        </div>
      `;
      storyListContainer.appendChild(storyItem);
    });
    const geojsonData = storiesToGeoJSON(stories);
    const geoJsonLayer = L.geoJSON(geojsonData, {
      onEachFeature: (feature, layer) => {
        if (feature.properties) {
          const { id, name, description, photoUrl } = feature.properties;
          this._storyMarkers[id] = layer;
          const popupContent = `...`;
          layer.bindPopup(popupContent);
          layer.on("popupopen", (e) => {
          });
          const markerIcon = layer.getElement();
          if (markerIcon) {
          }
        }
      },
    }).addTo(this._map);

    if (geoJsonLayer.getBounds().isValid()) {
      this._map.fitBounds(geoJsonLayer.getBounds().pad(0.1));
    }

    this._addStoryListClickListener();
  }


  _addStoryListClickListener() {
    const storyListContainer = document.getElementById("story-list");

    storyListContainer.addEventListener("click", async (e) => {
      const clickedCard = e.target.closest(".story-item");
      if (!clickedCard) return;

      if (e.target.classList.contains("button-save-favorite")) {
        e.stopPropagation();

        try {
          const storyData = JSON.parse(clickedCard.dataset.story);
          await StoryDb.addFavorite(storyData);
          alert(`Cerita "${storyData.name}" berhasil disimpan ke favorit!`);
        } catch (error) {
          console.error("Gagal menyimpan favorit:", error);
          alert("Gagal menyimpan cerita.");
        }
        return;
      }

      const { storyId, lat, lon } = clickedCard.dataset;
      this._activateStory(storyId, lat, lon);
    });

    storyListContainer.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const card = e.target.closest(".story-item");
        if (!card) return;


        if (document.activeElement.classList.contains("button-save-favorite")) {
          document.activeElement.click();
        } else {
          const { storyId, lat, lon } = card.dataset;
          this._activateStory(storyId, lat, lon);
        }
      }
    });
  }
}
