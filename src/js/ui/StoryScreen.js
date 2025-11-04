/**
 * 게임 시작 전 스토리 화면
 */
export class StoryScreen {
    constructor() {
        this.storyScreen = document.getElementById('storyScreen');
        this.storyText = document.getElementById('storyText');
        this.storySkip = document.getElementById('storySkip');

        this.stories = {
            intro: `나는 버려졌다.

주인은 짐을 싸고, 마지막으로 나를 한 번 돌아봤다. 그리고 문을 닫았다. 남은 건 주인 냄새가 밴 공기와, 부에노스아이레스라고 적힌 찢어진 종이 조각뿐.

배신감? 분노? 그런 건 중요하지 않다. 중요한 건 단 하나.

주인이 나를 떠나 어디로 튀었는지, 나는 안다.

바다를 건너든, 땅 끝까지 가든 상관없다. 나는 움직였다. 한국의 낯선 항구, 거대한 배의 어두운 틈.

지금 나는 간다. 주인이 도망친 그곳, 아르헨티나를 향해. 나는 멈추지 않을 것이다.`,

            argentina: `내 발은 멈추는 법을 잊었다.

수많은 날들을 걸었다. 익숙했던 모든 냄새가 사라지고, 차가운 흙과 돌, 낯선 물 냄새만 가득했다. 주인은 나를 버리고 세상의 반대편으로 도망쳤다. 나는 그가 향한 곳을 향해, 오직 그 길만을 따라 걸었다.

내 발바닥은 굳은살로 덮였다. 모든 것이 무의미했지만, 발걸음을 멈출 수는 없었다. 나를 버린 자가 누리고 있을 안락함. 그것이 나의 연료였다.

그리고 지금.

숨을 들이마신다. 이전과는 완전히 다른 공기. 코끝에 닿는 이국적인 향, 멀리서 들리는 날카로운 리듬. 여기가 그가 도망친 곳, 아르헨티나다.

나는 걷는다. 뼈아픈 수천 킬로미터의 여정은 끝났다.

이제 찾을 시간이다. 나는 안다. 그는 이 거대한 도시의 어딘가에 숨어 있다.`,

            ending: `나는 주인이 아르헨티나로 도망친 것을 알았다. 분노에 차 나는 그 먼 길을 따라 걸었다. 오직 주인을 찾겠다는 일념뿐이었다.

부에노스아이레스. 나는 그를 발견했다. 하지만 그는 다른 고양이를 안고 있었다. 내 모든 여정이 배신이었음을 깨달았다. 나는 미련 없이 돌아서, 다시 한국으로 걸었다. 집으로.

텅 빈 줄 알았던 집에 주인이 서 있었다. 옆에는 그 하얀 고양이도 있었다.

주인은 나를 안고 울었다. "미안해, 널 외롭게 할까 봐 아르헨티나에 가서 네 친구를 입양하러 간 거야."

오해였다. 모든 분노는 녹아내렸다.

나는 이제 혼자가 아니다. 새로운 친구와 함께, 진짜 나의 집에서 행복하게 살았다.`
        };

        this.currentStory = '';
        this.currentIndex = 0;
        this.typingSpeed = 50; // 밀리초 단위
        this.isTyping = false;
        this.typingInterval = null;
        this.onComplete = null;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // 클릭으로 스킵
        this.storyScreen.addEventListener('click', () => {
            this.skip();
        });

        // 스페이스바로 스킵
        const handleKeyPress = (e) => {
            if (e.code === 'Space' && this.isTyping) {
                e.preventDefault();
                this.skip();
            }
        };

        this.keyPressHandler = handleKeyPress;
        document.addEventListener('keydown', this.keyPressHandler);
    }

    start(onComplete, storyType = 'intro') {
        this.currentStory = this.stories[storyType];
        this.onComplete = onComplete;
        this.currentIndex = 0;
        this.storyText.textContent = '';
        this.isTyping = true;

        this.typeText();
    }

    typeText() {
        if (this.currentIndex < this.currentStory.length) {
            this.storyText.textContent += this.currentStory[this.currentIndex];
            this.currentIndex++;

            this.typingInterval = setTimeout(() => {
                this.typeText();
            }, this.typingSpeed);
        } else {
            this.finish();
        }
    }

    skip() {
        if (this.isTyping) {
            clearTimeout(this.typingInterval);
            this.storyText.textContent = this.currentStory;
            this.finish();
        }
    }

    finish() {
        this.isTyping = false;

        // 2초 후 메뉴 화면으로 전환
        setTimeout(() => {
            this.hide();
            if (this.onComplete) {
                this.onComplete();
            }
        }, 2000);
    }

    hide() {
        this.storyScreen.classList.remove('active');
        document.removeEventListener('keydown', this.keyPressHandler);
    }

    show() {
        this.storyScreen.classList.add('active');
    }
}
