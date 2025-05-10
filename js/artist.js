document.addEventListener("DOMContentLoaded", function () {
    // Get artist name from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const artistName = urlParams.get("name");
    if (!artistName) {
        document.body.innerHTML = "<p>未找到歌手信息</p>";
        return;
    }

    // Update header with artist name
    document.getElementById("artist-name").textContent = artistName;

    // Load latest date
    fetch("../data/latest.txt")
        .then(response => response.text())
        .then(text => {
            let lines = text.trim().split("\n");
            if (lines.length < 1) throw new Error("Invalid latest.txt format");

            let jsonFileName = `../data/${lines[0].trim()}`;
            let dateMatch = jsonFileName.match(/yt_(\d{8})\.json/);
            if (dateMatch) {
                let rawDate = dateMatch[1];
                let formattedDate = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
                document.getElementById("current-date").textContent = formattedDate;
            }

            return fetch(jsonFileName);
        })
        .then(response => response.json())
        .then(data => {
            let artistData = data.find(artist => artist.artist === artistName);
            if (!artistData) throw new Error("Artist data not found");

            let songList = document.getElementById("song-list");
            artistData.videos.slice(0, 10).forEach((video, index) => {
                let row = document.createElement("tr");
                row.innerHTML = `
                    <td class="sequence">${index + 1}</td>
                    <td>
                        <a class="title" href="https://www.youtube.com/watch?v=${video.video_id}" target="_blank">
                            ${video.title}
                        </a>
                    </td>
                    <td class="metric views">${video.views.toLocaleString()}</td>
                `;
                songList.appendChild(row);
            });
        })
        .catch(error => console.error("Error loading artist data:", error));
});
