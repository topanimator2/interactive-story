document.addEventListener("DOMContentLoaded", function () {
  let title = document.querySelector("#title");
  let storyText = document.querySelector("#story-text");
  let optionsContainer = document.querySelector("#options-container");

  const GITHUB_BASE_URL = "https://raw.githubusercontent.com/topanimator2/interactive-story/main/stories";
  let storyData = {}; // To hold the loaded story data
  let storyEndings = {}; // To hold the loaded endings data
  let storyState = {}; // To track the current state, like traits
  let currentStory = ""; // To track the current story folder
  let currentPart = "Start"; // To track the current part of the story

  // Function to load JSON data from GitHub
  async function loadJsonFromGitHub(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error loading JSON from ${url}`);
    }
    return await response.json();
  }

  // Function to initialize the story overview screen
  async function loadStoryOverview() {
    try {
      const storyOverviewUrl = `${GITHUB_BASE_URL}/storyinfo.json`;
      const stories = await loadJsonFromGitHub(storyOverviewUrl);

      // Create a container for story overviews
      const overviewContainer = document.createElement("div");
      overviewContainer.id = "overview-container";

      stories.forEach((story) => {
        const storyDiv = document.createElement("div");
        storyDiv.className = "story-item";

        // Create the title for the story
        const storyButton = document.createElement("button");
        storyButton.textContent = story.title;
        storyButton.onclick = () => loadStory(story.folder);
        storyDiv.appendChild(storyButton);

        // Create the image element for the story
        const storyImage = new Image();
        storyImage.src = `${GITHUB_BASE_URL}/${story.image}`;
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

  // Function to load a selected story
  async function loadStory(storyFolder) {
    try {
      const overviewContainer = document.getElementById("overview-container");
      if (overviewContainer) {
        overviewContainer.style.display = "none"; // Hide overview when a story is selected
      }

      currentStory = storyFolder; // Set the current story folder

      // Load story and endings data
      const storyUrl = `${GITHUB_BASE_URL}/${storyFolder}/story.json`;
      const endingsUrl = `${GITHUB_BASE_URL}/${storyFolder}/endings.json`;
      storyData = await loadJsonFromGitHub(storyUrl);
      storyEndings = await loadJsonFromGitHub(endingsUrl);

      // Start the story at the 'Start' node
      updateStory(currentPart);

      // Update the hash in the URL with the initial state
      updateHash();
    } catch (error) {
      console.error("Error loading story:", error);
    }
  }

  // Function to update the story based on the current part
  function updateStory(partName) {
    currentPart = partName; // Set the current part of the story
    const part = storyData[partName];
    title.textContent = partName;
    storyText.innerHTML = part.text;
    optionsContainer.innerHTML = "";

    part.options.forEach(option => {
      const [optionText, nextPart, funcs] = option;
      const optionButton = document.createElement("button");
      optionButton.textContent = optionText;

      optionButton.onclick = function () {
        if (funcs) {
          funcs.forEach(func => {
            handleFunction(func);
          });
        }
        updateStory(nextPart);
        updateHash(); // Update the hash whenever the story updates
      };

      if (checkConditions(funcs)) {
        optionsContainer.appendChild(optionButton);
      }
    });

    if (part.ending) {
      handleEnding(part.ending);
    }
  }

  // Function to handle functions and state changes
  function handleFunction(func) {
    const [funcName, ...args] = func;

    switch (funcName) {
      case "function_Manage":
        manageState(args);
        break;
      case "function_End":
        endStory(args[0]);
        break;
      default:
        console.error(`Unknown function: ${funcName}`);
    }
  }

  // Function to manage state based on 'function_Manage'
  function manageState([action, key, value]) {
    switch (action) {
      case "add":
        storyState[key] = (storyState[key] || 0) + parseInt(value);
        break;
      case "remove":
        storyState[key] = (storyState[key] || 0) - parseInt(value);
        break;
      case "set":
        storyState[key] = value;
        break;
      default:
        console.error(`Unknown action: ${action}`);
    }
  }

  // Function to check conditions before showing an option
  function checkConditions(funcs) {
    if (!funcs) return true;

    return funcs.every(func => {
      if (func[0] !== "condition") return true;

      const [_, key, operator, value] = func;
      const stateValue = parseInt(storyState[key] || 0);
      const conditionValue = parseInt(value);

      switch (operator) {
        case ">":
          return stateValue > conditionValue;
        case "<":
          return stateValue < conditionValue;
        case "==":
          return stateValue == conditionValue;
        default:
          return false;
      }
    });
  }

  // Function to handle the end of the story
  function endStory(endingKey) {
    const ending = storyEndings.endings[endingKey];
    if (ending) {
      title.textContent = ending.title;
      storyText.innerHTML = ending.text;

      if (ending.image) {
        const imageElement = new Image();
        imageElement.src = `${GITHUB_BASE_URL}/${ending.image}`;
        document.body.appendChild(imageElement);
      }

      if (ending.music) {
        const audio = new Audio(`${GITHUB_BASE_URL}/${ending.music}`);
        audio.play();
      }

      if (ending.function) {
        handleFunction([ending.function]);
      }

      optionsContainer.innerHTML = ""; // No more options at the end
    } else {
      console.error(`Ending not found: ${endingKey}`);
    }
  }

  // Function to update the URL hash with the current story, part, and state
  function updateHash() {
    const stateString = Object.entries(storyState).map(([key, value]) => `${key}=${value}`).join("&");
    window.location.hash = `#${currentStory}#${currentPart}#${stateString}`;
  }

  // Function to initialize the story state from the URL hash
  function initStateFromHash() {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    const [storyFolder, partName, stateString] = hash.split("#");
    if (storyFolder) {
      currentStory = storyFolder;
      currentPart = partName || "Start";

      // Parse the state from the state string
      if (stateString) {
        const statePairs = stateString.split("&");
        statePairs.forEach(pair => {
          const [key, value] = pair.split("=");
          storyState[key] = isNaN(value) ? value : parseInt(value);
        });
      }

      // Hide the story chooser when loading from hash
      const overviewContainer = document.getElementById("overview-container");
      if (overviewContainer) {
        overviewContainer.style.display = "none";
      }

      // Load the story with the current state
      loadStory(currentStory);
    }
  }

  // Initialize the story state from the URL hash on page load
  initStateFromHash();

  // Initialize the story overview screen when the page loads
  loadStoryOverview();
});
