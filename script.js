document.addEventListener("DOMContentLoaded", function () {
  let title = document.querySelector("#title");
  let storyText = document.querySelector("#story-text");
  let optionsContainer = document.querySelector("#options-container");

  const GITHUB_BASE_URL = "https://raw.githubusercontent.com/topanimator2/interactive-story/main/stories/storyinfo.json";

  // Function to load JSON from GitHub
  async function loadJsonFromGitHub(url) {
    const response = await fetch(url);
    return await response.json();
  }

  // Load story information for the overview screen
  async function loadStoryOverview() {
    try {
      const storyOverviewUrl = `${GITHUB_BASE_URL}/stories/storyInfo.json`;
      const stories = await loadJsonFromGitHub(storyOverviewUrl);

      // Create a main screen with story overviews
      const overviewContainer = document.createElement("div");
      overviewContainer.id = "overview-container";

      stories.forEach(story => {
        const storyDiv = document.createElement("div");
        storyDiv.className = "story-item";

        // Create the title for the story
        const storyButton = document.createElement("button");
        storyButton.textContent = story.title;
        storyButton.onclick = () => loadStory(story.folder);
        storyDiv.appendChild(storyButton);

        // Create the image element for the story
        const storyImage = new Image();
        storyImage.src = `${GITHUB_BASE_URL}/stories/${story.image}`;
        storyImage.alt = story.title;
        storyImage.className = "story-image";
        storyDiv.appendChild(storyImage);

        overviewContainer.appendChild(storyDiv);
      });

      document.body.appendChild(overviewContainer);
    } catch (error) {
      console.error("Error loading story overview:", error);
    }
  }

  // Load a selected story from its folder
  async function loadStory(storyFolder) {
    try {
      const overviewContainer = document.getElementById("overview-container");
      if (overviewContainer) {
        overviewContainer.style.display = "none";
      }

      const storyUrl = `${GITHUB_BASE_URL}/stories/${storyFolder}/story.json`;
      const storyData = await loadJsonFromGitHub(storyUrl);

      updateStory(storyData, "Start", storyFolder);
    } catch (error) {
      console.error("Error loading story:", error);
    }
  }

  function updateStory(storyData, partName, storyFolder) {
    const part = storyData[partName];
    title.textContent = partName;
    storyText.innerHTML = part.text;
    optionsContainer.innerHTML = "";

    part.options.forEach((option) => {
      const optionButton = document.createElement("button");
      optionButton.textContent = option[0];
      optionButton.onclick = function () {
        updateStory(storyData, option[1], storyFolder);
        if (option[2]) {
          option[2].forEach((func) => {
            func(); // Execute each function in the array
          });
        }
      };
      optionsContainer.appendChild(optionButton);
    });

    if (part.ending) {
      handleEnding(part.ending, storyFolder);
    }
  }

  // Handle story ending
  function handleEnding(endingName, storyFolder) {
    const endingUrl = `${GITHUB_BASE_URL}/stories/${storyFolder}/endings.json`;
    loadJsonFromGitHub(endingUrl).then(endingData => {
      const ending = endingData[endingName];
      title.textContent = ending.title;
      storyText.innerHTML = ending.text;

      const imageElement = new Image();
      imageElement.src = `${GITHUB_BASE_URL}/stories/${storyFolder}/images/${ending.image}`;
      document.body.appendChild(imageElement);

      if (ending.music) {
        const audio = new Audio(`${GITHUB_BASE_URL}/stories/${storyFolder}/sounds/${ending.music}`);
        audio.play();
      }

      if (ending.function) {
        ending.function();
      }
    });
  }

  // Initial setup: Load story overview
  loadStoryOverview();
});
