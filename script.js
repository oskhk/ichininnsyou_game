let currentStage = 0;
let correctAnswers = 0;
let totalStages = 20;
let stages = [];
let currentBubbleIndex = 0;
let selectedGender = '';
let maleStages = [];
let femaleStages = [];
let answers = [];
let cameFromEndingScreen = false;

fetch('scenarios.json')
    .then(response => response.json())
    .then(data => {
        maleStages = data.maleStages;
        femaleStages = data.femaleStages;
    })
    .catch(error => console.error('JSONのロードに失敗しました:', error));

document.getElementById('maleButton').onclick = () => {
    selectedGender = 'male';
    updateSelectedButton('maleButton', 'femaleButton');
};

document.getElementById('femaleButton').onclick = () => {
    selectedGender = 'female';
    updateSelectedButton('femaleButton', 'maleButton');
};

function updateSelectedButton(selectedId, otherId) {
    const selectedButton = document.getElementById(selectedId);
    const otherButton = document.getElementById(otherId);
    selectedButton.classList.add('selected');
    otherButton.classList.remove('selected');
}

document.getElementById('startButton').onclick = () => {
    if (selectedGender === 'male') {
        stages = maleStages;
    } else if (selectedGender === 'female') {
        stages = femaleStages;
    }

    stages = shuffle(stages);
    answers = new Array(stages.length);
    cameFromEndingScreen = false;
    switchScreen('startScreen', 'gameScreen');
    loadStage(stages[currentStage]);
};

function switchScreen(hideScreenId, showScreenId) {
    document.getElementById(hideScreenId).classList.remove('active');
    document.getElementById(showScreenId).classList.add('active');
}

function loadStage(stage) {
    answers[currentStage] = undefined;

    document.getElementById('scenarioTitle').textContent = stage.title;
    document.getElementById('scenarioDescription').textContent = stage.description;

    const playerName = document.getElementById('playerName').value || 'あなた';
    const responseText = highlightPlaceholder(stage.response.replace(/{name}/g, playerName));
    document.getElementById('response').innerHTML = responseText;

    const imageArea = document.getElementById('imageArea');
    imageArea.innerHTML = '';

    preloadImage(stage.image)
        .then(img => {
            img.alt = "キャラクター";
            img.className = 'character-image';
            imageArea.appendChild(img);
        })
        .catch(error => {
            console.error('画像のロードに失敗しました:', error);
        });

    stage.bubbles.forEach((bubbleText, index) => {
        const bubble = document.createElement('div');
        bubble.className = 'speech-bubble';
        bubble.innerHTML = highlightPlaceholder(bubbleText.replace(/{name}/g, playerName));
        bubble.style.display = 'none';
        imageArea.appendChild(bubble);
    });

    currentBubbleIndex = 0;
    document.getElementById('feedback').textContent = '';

    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';

    const randomizedOptions = [...stage.options].map((option, index) => ({
        text: option,
        originalIndex: index
    })).sort(() => Math.random() - 0.5);
    
    randomizedOptions.forEach((optionObj) => {
        const button = document.createElement('button');
        button.className = 'option';
        button.textContent = optionObj.text;
    
        button.onclick = () => {
            selectOption(optionObj.originalIndex, stage, stage.feedback[optionObj.originalIndex]);
        };
    
        optionsContainer.appendChild(button);
    });
    

    const backToEndingButton = document.getElementById('backButton');
    if (cameFromEndingScreen) {
        backToEndingButton.style.display = 'block';
        backToEndingButton.onclick = () => {
            switchScreen('gameScreen', 'endingScreen');
        };
    } else {
        backToEndingButton.style.display = 'none';
    }

    setupNextStageButton();
    setupResetBubbleButton(imageArea);
    setupEventHandlers(imageArea);
    updateProgress();
}



function preloadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

function setupEventHandlers(imageArea) {
    const bubbles = imageArea.querySelectorAll('.speech-bubble');
    currentBubbleIndex = 0;

    imageArea.onclick = () => {
        if (currentBubbleIndex < bubbles.length) {
            const bubble = bubbles[currentBubbleIndex];
            bubble.style.display = 'block';

            const isLeft = currentBubbleIndex % 2 === 0;
            bubble.classList.toggle('left', isLeft);
            bubble.classList.toggle('right', !isLeft);

            bubble.style.top = `${currentBubbleIndex * 80}px`;
            currentBubbleIndex++;
        }
    };
}


function highlightPlaceholder(text) {
    return text.replace(/\(　\?　\)/g, '<span class="highlight">(　?　)</span>');
}

function setupNextStageButton() {
    const nextStageButton = document.getElementById('nextStageButton');
    nextStageButton.style.display = 'none';
    nextStageButton.onclick = () => {
        currentStage++;
        if (currentStage < stages.length) {
            loadStage(stages[currentStage]);
        } else {
            showEndingScreen();
        }
    };
}

function selectOption(optionIndex, stage, feedback) {
    if (answers[currentStage] !== undefined) {
        return;
    }

    const selectedAnswer = stage.options[optionIndex];

    console.log("🎯 選択した正解:", selectedAnswer);
    console.log("🎯 正解:", stage.correctAnswer);

    if (stage.correctAnswer.map(ans => ans.trim()).includes(selectedAnswer.trim())) { 
        console.log("✅ 正解!");
        showResultImage(stage.correctImage);
        correctAnswers++;
    } else {
        console.log("❌ 不正解!");
        showResultImage(stage.incorrectImage);
    }

    answers[currentStage] = selectedAnswer;
    document.getElementById('feedback').textContent = feedback;

    const nextStageButton = document.getElementById('nextStageButton');
    nextStageButton.style.display = 'block';
}



function setupResetBubbleButton(imageArea) {
    const resetBubbleButton = document.getElementById('resetBubbleButton');
    resetBubbleButton.style.display = 'block';
    resetBubbleButton.onclick = () => resetBubbles(imageArea);
}

function resetBubbles(imageArea) {
    const bubbles = imageArea.querySelectorAll('.speech-bubble');
    bubbles.forEach((bubble) => {
        bubble.style.display = 'none';
    });
    currentBubbleIndex = 0;
}

async function showResultImage(imagePath) {
    const resultImage = document.createElement('img');
    resultImage.src = imagePath;
    resultImage.alt = "結果表示";
    resultImage.className = 'result-mark';
    document.body.appendChild(resultImage);

    await new Promise(resolve => setTimeout(resolve, 1500));
    resultImage.remove();
}

function updateProgress() {
    document.getElementById('stageClearCount').textContent = correctAnswers;
    document.getElementById('stageProgressCount').textContent = currentStage + 1;
    document.getElementById('totalStageCount').textContent = totalStages;
}

function showEndingScreen() {
    switchScreen('gameScreen', 'endingScreen');
    cameFromEndingScreen = true;

    const scoreSummary = `全 ${totalStages} ステージ中、\n${correctAnswers} ステージ正解しました。`;
    document.getElementById('scoreSummary').textContent = scoreSummary;

    const incorrectStagesContainer = document.getElementById('incorrectStages');
    incorrectStagesContainer.innerHTML = '';

    stages.forEach((stage, i) => {
        if (!stage.correctAnswer.includes(answers[i])) {
            const stageElement = document.createElement('p');
            stageElement.textContent = stage.title;
            stageElement.className = 'incorrect-stage';
            stageElement.onclick = () => {
                currentStage = i;
                loadStage(stage);
                switchScreen('endingScreen', 'gameScreen');
            };
            incorrectStagesContainer.appendChild(stageElement);
        }
    });
}



function scrollToTop() {
    if ('scrollBehavior' in document.documentElement.style) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }
}

function resetScroll() {
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
        document.body.style.overflow = '';
        window.scrollTo(0, 0);
    }, 50);
}

function switchScreen(hideScreenId, showScreenId) {
    document.getElementById(hideScreenId).classList.remove('active');
    document.getElementById(showScreenId).classList.add('active');
    resetScroll();
}





function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

document.getElementById('retryButton').onclick = () => {
    currentStage = 0;
    correctAnswers = 0;
    currentBubbleIndex = 0;
    answers = [];
    cameFromEndingScreen = false;
    switchScreen('endingScreen', 'startScreen');
    document.getElementById('nextStageButton').style.display = 'none';
    document.getElementById('feedback').textContent = '';
};