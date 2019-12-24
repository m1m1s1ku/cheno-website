import { css } from 'lit-element';

export const MainStyling = css`
.logo {
    cursor: pointer;
}

.content {
    color: var(--elara-font-color);
    display: inline-block;

    font-family: var(--elara-font-primary);
    opacity: 1;
    margin: 0;
    height: 100%;
    width: 100%;
}

.content.hidden {
    opacity: 0;
    z-index: 0;
    visibility: hidden;
}

header {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;

    z-index: 2;
    
    margin: 5px 30px;
}

footer {
    position: fixed;
    bottom: 0;
    left: 0;
    pointer-events: none;
    margin: 5px;
    color: rgba(0,0,0,.8);
    user-select: none;
    mix-blend-mode: soft-light;
}

@media (min-width: 700px){
    footer {
        margin: 30px;
    }
}

.logo {
    width: 150px;
    height: 90px;
}

.menu {
    z-index: 999;
    --color: #333;
    width: 36px;
    height: 36px;
    padding: 0;
    margin: 0;
    margin-top: 10px;
    outline: none;
    position: relative;
    border: none;
    background: none;
    cursor: pointer;
    -webkit-appearence: none;
    -webkit-tap-highlight-color: transparent;
}
.menu svg {
    width: 64px;
    height: 48px;
    top: -6px;
    left: -14px;
    stroke: var(--color);
    stroke-width: 3px;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
    display: block;
    position: absolute;
}
.menu svg path {
    transition: stroke-dasharray var(--duration, 0.85s) var(--easing, ease) var(--delay, 0s), stroke-dashoffset var(--duration, 0.85s) var(--easing, ease) var(--delay, 0s);
    stroke-dasharray: var(--array-1, 24px) var(--array-2, 100px);
    stroke-dashoffset: var(--offset, 126px);
    -webkit-transform: translateZ(0);
            transform: translateZ(0);
}
.menu svg path:nth-child(2) {
    --duration: .2s;
    --easing: ease-in;
    --offset: 100px;
    --array-2: 74px;
}
.menu svg path:nth-child(3) {
    --offset: 133px;
    --array-2: 107px;
}
.menu.active {
    --color: #fff;
}
.menu.active svg path {
    --offset: 57px;
}
.menu.active svg path:nth-child(1), .menu.active svg path:nth-child(3) {
    --delay: .15s;
    --easing: cubic-bezier(.2, .4, .2, 1.1);
}
.menu.active svg path:nth-child(2) {
    --duration: .4s;
    --offset: 2px;
    --array-1: 1px;
}
.menu.active svg path:nth-child(3) {
    --offset: 58px;
}

.main-menu {
    min-width: 30%;
    position: fixed;
    min-height: 100px;
    right: 0;
    top: 0;
    visibility: hidden;
    overflow: hidden;
    opacity: 0;
    transition: visibility 0s .3s, opacity .3s linear;
    border-radius: 0 0 4px 4px;
}

@media (max-width: 700px){
    .main-menu {
        min-width: 100%;
    }
    header {
        z-index: 5;
    }
}

.main-menu::after {
    position: absolute;
    bottom: 26px;
    content:'';
    width: 100%;
    height: 100vh;
    background-color: rgba(86, 86, 86, .9);
    transform: skewY(-20deg);
    border-radius: 4px;
    z-index: -1;
}

.main-menu.visible {
    opacity: 1;
    transition: opacity .3s linear;
    visibility: visible;
}

.main-menu nav ul {
    padding: 0 20px;
}

.main-menu nav ul li {
    color: white;
    cursor: pointer;
    list-style: none;
}

.main-menu nav ul li h3 {
    opacity: .5;
    line-height: 3em;
    font-family: var(--elara-font-primary);
    transition: opacity .3s linear;
}

.main-menu nav ul li h3:hover {
    opacity: 1;
}
  
svg.logo path {
    transition: fill .3s;
}
  
.write {
    stroke-dasharray: 7512.03125;
    stroke-dashoffset: 7512.03125;
    animation: writeLine 2s linear forwards;
}

@keyframes writeLine {
    to {
        stroke-dashoffset: 0;
    }
}
`;