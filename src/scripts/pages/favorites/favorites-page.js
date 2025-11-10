import StoryDb from "../../utils/db";
import { showFormattedDate } from "../../utils";

export default class FavoritesPage {
    async render() {
        return `<section class="container favorites-page-container"><div class="home-header">
    <h1>Cerita Tersimpan</h1>
    <div class="header-line"></div> </div>
    
    <div id="favorite-list" class="story-list grid-layout"> 
    <p>Memuat cerita tersimpan...</p>
    </div>
    </section>
    `;
    }

    async afterRender() {
        console.log("Rendering Halaman Favorites");
        const favoriteListContainer = document.getElementById("favorite-list");

        try {
            const stories = await StoryDb.getAllFavorites(); 

            if (stories.length === 0) {
                favoriteListContainer.innerHTML = `
                <div class="empty-state">
                <p>Anda belum menyimpan cerita favorit.</p>
                <p>Jelajahi <a href="#/">beranda</a> untuk menemukan cerita menarik dan menyimpannya!</p>
                </div>
                `;
                return;
            } 

            favoriteListContainer.innerHTML = "";
            stories.forEach((story) => {
                const storyItem = document.createElement("article");
                storyItem.classList.add("story-item");
                storyItem.dataset.storyId = story.id; 

                storyItem.innerHTML = `
                <img src="${story.photoUrl}" alt="Foto cerita oleh ${story.name}" class="story-image">
                <div class="story-content">
                <h3 class="story-name" contenteditable="false" data-field="name">${story.name}</h3>
                <p class="story-date">${showFormattedDate(story.createdAt)}</p>
                <p class="story-description" contenteditable="false" data-field="description">${story.description.substring(0,150)}...</p>

                <div class="favorite-buttons">
                <button class="button-primary button-edit-favorite" data-id="${story.id}">Edit</button><button class="button-primary button-delete-favorite" data-id="${story.id}">
                Hapus</button>
                </div>
                </div>
                `;
                favoriteListContainer.appendChild(storyItem);
            }); 

            favoriteListContainer.addEventListener("click", async (event) => {
                const storyItem = event.target.closest(".story-item");
                if (!storyItem) return;

                const storyId = storyItem.dataset.storyId; 

                if (event.target.classList.contains("button-delete-favorite")) {
                    if (confirm("Anda yakin ingin menghapus cerita ini dari favorit?")) {
                        try {
                            await StoryDb.deleteFavorite(storyId);
                            alert("Cerita berhasil dihapus!");
                            this.afterRender(); 
                        } catch (error) {
                            console.error("Gagal menghapus favorit:", error);
                            alert(`Gagal menghapus favorit: ${error.message}`);
                        }
                    }
                } 

                if (event.target.classList.contains("button-edit-favorite")) {
                    const editButton = event.target;
                    const nameElement = storyItem.querySelector('[data-field="name"]');
                    const descElement = storyItem.querySelector(
                        '[data-field="description"]'
                    ); 
                    const isEditing = editButton.classList.contains("is-editing");

                    if (isEditing) {
                        try {
                            const originalStory = await StoryDb.getFavorite(storyId); 
                            originalStory.name = nameElement.textContent;
                            originalStory.description = descElement.textContent; 

                            await StoryDb.addFavorite(originalStory);

                            nameElement.contentEditable = false;
                            descElement.contentEditable = false;
                            editButton.textContent = "Edit";
                            editButton.classList.remove("is-editing", "button-save");
                            nameElement.classList.remove("is-editing-field");
                            descElement.classList.remove("is-editing-field");
                            alert("Perubahan berhasil disimpan!");
                        } catch (error) {
                            console.error("Gagal menyimpan perubahan:", error);
                            alert("Gagal menyimpan perubahan.");
                        }
                    } else {

                        nameElement.contentEditable = true;
                        descElement.contentEditable = true;
                        editButton.textContent = "Simpan";
                        editButton.classList.add("is-editing", "button-save");
                        nameElement.classList.add("is-editing-field");
                        descElement.classList.add("is-editing-field"); 
                        nameElement.focus();
                    }
                }
            });
        } catch (error) {
            console.error("Gagal memuat favorit:", error);
            favoriteListContainer.innerHTML = `
            <div class="error-message">
            <p>Terjadi kesalahan saat memuat cerita favorit: ${error.message}</p></div>`;
        }
    }
}
