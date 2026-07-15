// =====================
// 画面切替
// =====================

function showScreen(screenId) {

    const screens = document.querySelectorAll(".screen");

    screens.forEach(screen => {
        screen.style.display = "none";
    });

    document.getElementById(screenId).style.display = "block";

}

// 最初はホーム画面を表示
showScreen("home");

// =====================
// データの保存・読み込み
// =====================
 
let allSongs = [];

function saveSongs() {
    localStorage.setItem("songs", JSON.stringify(allSongs));
}

const savedSongs = localStorage.getItem("songs");

if (savedSongs) {

    allSongs = JSON.parse(savedSongs);

    filterSongs();
    displayRecommendations();

} else {

    fetch("songs.json")
        .then(response => response.json())
        .then(songs => {

            allSongs = songs;

            saveSongs();

            filterSongs();
            displayRecommendations();

        });

}

// =====================
// 画面表示
// =====================

function displaySongs(songs) {

  const songList = document.getElementById("songList");

  if (songs.length === 0) {
    songList.innerHTML = "<p>曲が見つかりません。</p>";
    return;
  }

  const html = songs.map(song => {

    const realIndex = allSongs.indexOf(song);

    return `
      <div class="song">

        <button onclick="toggleFavorite(${realIndex})">
          ${song.favorite ? "⭐" : "☆"}
        </button>

        <strong>${song.title}</strong><br>

        <div>
          📅 最終演奏日：
          ${song.lastPlayed || "未登録"}
        </div>

        <div>
          📖 演奏履歴<br>
          ${
            song.playHistory && song.playHistory.length > 0
              ? song.playHistory.slice(-10).reverse().join("<br>")
              : "まだありません"
          }
        </div>

        <small>🎼 ${song.genre ?? "未分類"}</small><br>

        <div class="memo">
          📝 ${song.memo || "メモなし"}
        </div>

        <div>
          リクエスト：${song.requestCount ?? 0}回
          <button onclick="changeRequest(${realIndex}, -1)">－</button>
          <button onclick="changeRequest(${realIndex}, 1)">＋</button>
        </div>

        <select onchange="changeStatus(${realIndex}, this.value)">
          <option value="演奏可能" ${song.status === "演奏可能" ? "selected" : ""}>演奏可能</option>
          <option value="練習中" ${song.status === "練習中" ? "selected" : ""}>練習中</option>
          <option value="暗譜中" ${song.status === "暗譜中" ? "selected" : ""}>暗譜中</option>
        </select>

        <button onclick="editMemo(${realIndex})">
          📝 メモ
        </button>

        <button onclick="updatePlayedDate(${realIndex})">
          📅 演奏した
        </button>

        <button onclick="deleteSong(${realIndex})">
          🗑 削除
        </button>

      </div>
    `;

  }).join("");

  songList.innerHTML = html;

}

function displayRecommendations() {

  const area = document.getElementById("recommendArea");
if (!area) return;

  // 人気TOP3
  const popular = [...allSongs]
    .sort((a, b) => (b.requestCount ?? 0) - (a.requestCount ?? 0))
    .slice(0, 3);

  // 古い順（未登録を優先）
  const oldSongs = [...allSongs]
    .sort((a, b) => {

      const dateA = a.lastPlayed || "1900/01/01";
      const dateB = b.lastPlayed || "1900/01/01";

      return new Date(dateA) - new Date(dateB);

    })
    .slice(0, 3);

  area.innerHTML = `
    <h3>🔥 人気曲</h3>

    <ol>
      ${popular.map(song =>
        `<li>${song.title}（${song.requestCount ?? 0}回）</li>`
      ).join("")}
    </ol>

    <h3>🌱 久しぶりに弾こう</h3>

    <ol>
      ${oldSongs.map(song =>
        `<li>${song.title}（${song.lastPlayed || "未演奏"}）</li>`
      ).join("")}
    </ol>
  `;

}

function updateDisplay() {

  const keyword = search.value.toLowerCase();
  const genre = genreFilter.value;

  let songs = [...allSongs];

  // 曲名検索
  songs = songs.filter(song =>
    song.title.toLowerCase().includes(keyword)
  );

  // ジャンル絞り込み
  if (genre !== "すべて") {
    songs = songs.filter(song => song.genre === genre);
  }

  // リクエスト順
  songs.sort((a, b) =>
    (b.requestCount ?? 0) - (a.requestCount ?? 0)
  );

  displaySongs(songs);
  displayRecommendations();
}

const search = document.getElementById("search");
const genreFilter = document.getElementById("genreFilter");

search.addEventListener("input", filterSongs);

genreFilter.addEventListener("change", updateDisplay);

const sortRequest = document.getElementById("sortRequest");

sortRequest.addEventListener("click", () => {

  allSongs.sort((a, b) => {

    return (b.requestCount ?? 0) - (a.requestCount ?? 0);

  });

  saveSongs();
  filterSongs();

});
const addButton = document.getElementById("addButton");

// =====================
// 曲の追加・削除
// =====================
 
addButton.addEventListener("click", () => {

  const title = document.getElementById("newSong").value.trim();
  const status = document.getElementById("newStatus").value;
  const genre = document.getElementById("newGenre").value;

  if (title === "") {
    alert("曲名を入力してください");
    return;
  }

  allSongs.push({
    title,
    status,
    genre,
    type: "ピアノ",
    favorite: false,
    requestCount: 0,
    memo: "",
    lastPlayed: "",
    playHistory: []
  });

  saveSongs();
  filterSongs();

  document.getElementById("newSong").value = "";

});

function deleteSong(index) {

  if (!confirm("この曲を削除しますか？")) {
    return;
  }

  allSongs.splice(index, 1);

  saveSongs();
  filterSongs();
}

// =====================
// 編集機能
// =====================

function changeStatus(index, newStatus) {

  allSongs[index].status = newStatus;

  saveSongs();
  filterSongs();
}
function changeRequest(index, amount) {

  if (allSongs[index].requestCount === undefined) {
    allSongs[index].requestCount = 0;
  }

  allSongs[index].requestCount += amount;

  if (allSongs[index].requestCount < 0) {
    allSongs[index].requestCount = 0;
  }

  saveSongs();
  filterSongs();

}

function editMemo(index) {

  const memo = prompt(
    "メモを入力してください",
    allSongs[index].memo || ""
  );

  if (memo === null) {
    return;
  }

  allSongs[index].memo = memo;

  saveSongs();

  filterSongs();

}

function toggleFavorite(index) {

  allSongs[index].favorite = !allSongs[index].favorite;

  saveSongs();

  filterSongs();

}
// =====================
// 検索・絞り込み
// =====================
 
function filterSongs() {

  const keyword = search.value.toLowerCase();
  const genre = genreFilter.value;

  const filtered = allSongs.filter(song => {

    const matchKeyword =
      song.title.toLowerCase().includes(keyword) ||
      (song.memo || "").toLowerCase().includes(keyword);

    const matchGenre =
      genre === "すべて" || song.genre === genre;

    return matchKeyword && matchGenre;

  });

  displaySongs(filtered);
  displayRecommendations();

}

const backupButton = document.getElementById("backupButton");

// =====================
// バックアップ
// =====================

backupButton.addEventListener("click", () => {

  const data = JSON.stringify(allSongs, null, 2);

  const blob = new Blob([data], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;
  a.download = "LivePianoManager_backup.json";

  a.click();

  URL.revokeObjectURL(url);

});

const restoreButton = document.getElementById("restoreButton");
const restoreFile = document.getElementById("restoreFile");


restoreButton.addEventListener("click", () => {

  restoreFile.click();

});


restoreFile.addEventListener("change", (event) => {

  const file = event.target.files[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();


  reader.onload = () => {

    const songs = JSON.parse(reader.result);

    allSongs = songs;

    saveSongs();

    filterSongs();

    alert("バックアップを復元しました");

  };


  reader.readAsText(file);

});

function updatePlayedDate(index) {

  const today = new Date();

  const date =
    today.getFullYear() + "/" +
    (today.getMonth() + 1) + "/" +
    today.getDate();

  allSongs[index].lastPlayed = date;

  // 履歴がまだなければ作る
  if (!allSongs[index].playHistory) {
    allSongs[index].playHistory = [];
  }

  // 履歴に追加
  allSongs[index].playHistory.push(date);


  saveSongs();

  filterSongs();

}