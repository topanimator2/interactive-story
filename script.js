document.addEventListener("DOMContentLoaded", function () {
  let title = document.querySelector("#title");
  let storyText = document.querySelector("#story-text");
  let optionsContainer = document.querySelector("#options-container");

  let storyData = {}; // To hold the loaded story data
  let storyEndings = {}; // To hold the loaded endings data
  let storyState = {}; // To track the current state, like traits

  // Function to load JSON data
  async function loadJson(url) {
    const response = await fetch(url);
    return await response.json();
  }

  // Function to initialize the story
  async function initStory() {
    try {
      // Load story and ending data
      storyData = await loadJson('story.json');
      storyEndings = await loadJson('endings.json');
      // Start the story at the 'Start' node
      updateStory("Start");
    } catch (error) {
      console.error("Error loading story:", error);
    }
  }

  // Function to update the story based on the current part
  function updateStory(partName) {
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
    const ending = storyEndings[endingKey];
    if (ending) {
      title.textContent = ending.title;
      storyText.innerHTML = ending.text;

      if (ending.image) {
        const imageElement = new Image();
        imageElement.src = ending.image;
        document.body.appendChild(imageElement);
      }

      if (ending.music) {
        const audio = new Audio(ending.music);
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

  // Initialize the story when the page loads
  initStory();
});
