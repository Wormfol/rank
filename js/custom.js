// Global variable to store the fetched data
let globalData = [];
let currentMetric = 'total_views';
let currentGender = 'all';

// Function to handle ranking button clicks
// It maps the ranking type to the corresponding metric in the data
function switchRanking(metric, button) {
    document.querySelectorAll(".ranking-buttons button").forEach(button => button.classList.remove("active"));
    button.classList.add("active");

    // Update the table with the chosen metric
    currentMetric = metric;
    updateTable(currentMetric, currentGender);
    // console.log("after update metric: ", metric);
}


function switchGender(gender, button) {
    document.querySelectorAll(".gender-buttons button").forEach(button => button.classList.remove("active"));
    button.classList.add("active");

    currentGender = gender;
    updateTable(currentMetric, currentGender);
    // console.log("after update metric: ", currentMetric);
}



document.addEventListener("DOMContentLoaded", function () {    
    // Determine page type from URL
    const isNewArtistPage = window.location.pathname.includes("new_artists.html");
    const isMidArtistPage = window.location.pathname.includes("mid_artists.html");

    const groupInfoFile = isNewArtistPage 
    ? "../utils/new_artist.txt" 
    : isMidArtistPage 
        ? "../utils/mid_artist.txt" 
        : null;

    if (!groupInfoFile) {
        console.error("Unknown page type. Cannot determine group info file.");
        return;
    }

    let latestFile = "../data/latest.txt";
    // First: load the artist name list (as TXT)
    fetch(groupInfoFile)
        .then(response => response.text())
        .then(text => {
            // Split into clean array of names
            const groupNames = text
                .trim()
                .split("\n")
                .map(name => name.trim())
                .filter(name => name.length > 0);

            // Then: load the latest data file name
            return fetch(latestFile)
                .then(response => response.text())
                .then(text => {
                    let baseFile = text.trim().split("\n")[0].trim(); // e.g., yt_20250409.json
                    let jsonFileName = `../data/${baseFile}`;

                    // Optional: update the date on page
                    let dateMatch = baseFile.match(/yt_(\d{8})\.json/);
                    if (dateMatch) {
                        let rawDate = dateMatch[1];
                        let formattedDate = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
                        const dateEl = document.getElementById("current-date");
                        if (dateEl) dateEl.textContent = formattedDate;
                    }

                    // Now load the full artist content
                    return fetch(jsonFileName)
                        .then(response => response.json())
                        .then(fullData => {
                            // Filter fullData based on artist name
                            const filteredData = fullData.filter(item => groupNames.includes(item.artist));
                            globalData = filteredData;
                        
                            // Load gender data and attach to each artist
                            fetch("../utils/artist_gender.json")
                                .then(response => response.json())
                                .then(genderData => {
                                    const genderMap = {};
                                    genderData.forEach(entry => {
                                        genderMap[entry.name] = entry.gender.toLowerCase(); // "female", "male", etc.
                                    });
                        
                                    globalData.forEach(item => {
                                        item.gender = genderMap[item.artist] || "unknown";
                                    });
                        
                                    // Now ready to update table with default gender = "all"
                                    updateTable("total_views", "all");
                                })
                                .catch(err => {
                                    console.error("Failed to load gender data:", err);
                                    updateTable("total_views", "all");
                                });
                        });
                });
        })
        .catch(error => console.error("Error loading data:", error));
});

// Function to safely get the metric value, with fallback logic
function getMetricValue(artistData, metric) {
    return artistData[metric] !== undefined
        ? artistData[metric]
        : artistData.day_trend !== undefined
        ? artistData.day_trend
        : artistData.total_views !== undefined
        ? artistData.total_views
        : 0; // Default to 0 if all are missing
}


// Function to update the table given a metric key (e.g., "total_views", "day_trend")
function updateTable(metric, gender = "all") {
    const filteredData = globalData.filter(artist => {
        return gender === "all" || artist.gender?.toLowerCase() === gender;
    });

    // Create a copy of the data and sort it in descending order by the chosen metric
    const sortedData = filteredData.slice().sort((a, b) => getMetricValue(b, metric) - getMetricValue(a, metric));

    // Determine which chart is present
    let tableId = null;
    if (document.querySelector("#new_artist_chart")) {
        tableId = "new_artist_chart";
    } else if (document.querySelector("#mid_artist_chart")) {
        tableId = "mid_artist_chart";
    } else {
        console.error("No valid chart table found.");
        return;
    }

    let tableBody = document.querySelector(`#${tableId} tbody`);

    if (tableBody.children.length > 0) {
        tableBody.innerHTML = "";
    }
    
    sortedData.forEach((artistData, index) => {
        const artist = artistData.artist;
        // Get the metric value with fallback logic
        const metricValue = getMetricValue(artistData, metric).toLocaleString();
        // console.log("update metricValue: ", metricValue);
        
        // Prepare top videos HTML
        const topVideos = artistData.videos.slice(0, 3);
        const topTitles = topVideos.map(video =>
            `<a class="title" href="https://www.youtube.com/watch?v=${video.video_id}" target="_blank">
                <span>${video.title}</span>
                <span class="views">(${video.views.toLocaleString()})</span>
            </a>`
        ).join("<br>");

        // Build the table row HTML
        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="sequence">${index + 1}</td>
            <td><img class="cover" loading="lazy" src="../img/${artist}.jpg" alt="${artist} Cover"></td>
            <td>${topTitles}</td>
            <td class="artist">
                <a href="artist_data.html?name=${encodeURIComponent(artist)}">${artist}</a>
            </td>
            <td class="metric views">${metricValue}</td>
        `;
        tableBody.appendChild(row);
    });
}


document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("nominationForm");
    form.addEventListener("submit", function (e) {
        e.preventDefault(); // Prevent the form from submitting the default way
        const artistName = document.getElementById("artistName").value;
        const message = document.getElementById("comment").value;

        // Send the form data using EmailJS
        emailjs.init({
            publicKey: 'fO1tmOKZtnZrPwfzZ',
            // Do not allow headless browsers
            // blockHeadless: true,
            limitRate: {
              id: 'topsongs',
              throttle: 100000,
            },
          });

        emailjs.send("service_lha0zna","template_h20p2za",{
            from_name: artistName,
            message: message,
        })
        .then(function(response) {
            alert("Message sent!");
            form.reset();
        }, function(error) {
            alert("Fail, try again!");
        });
    });
});