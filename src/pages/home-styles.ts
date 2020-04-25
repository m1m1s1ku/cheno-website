import { css } from 'lit-element';

export const HomeStyling = css`
.home-container {
    display: grid;
    height: 100%;
    grid-auto-columns: 1fr;
    grid-auto-flow: column;
}

.series ul {
    text-align: right;
    margin: 0;
    margin-top: 100px;
}

.series ul li {
    list-style: none;
    line-height: 3em;
    margin-right: 3em;
    font-weight: bold;
    cursor: pointer;
    opacity: .5;
    transition: .3s opacity;
}

.series ul li:hover, .series ul li.selected {
    opacity: 1;
}

.series ul li.selected {
   cursor: default;
}

.series ul li h1.big {
    display: inline;
    font-family: var(--elara-font-display);
    font-size: 1.2em;
    position: relative;
    padding: .5em 0;
}

@media (min-width: 500px){
    .series ul li {
        line-height: 5em;
        margin-right: 5em;
    }

    .series ul li h1.big {
        font-size: 1.5em;
    }
}

.previewed {
    cursor: pointer;
    height: 75vh;
    width: 50vw;
    margin: 10px;
}

.series, .preview {
    height: 100vh;
    width: 50vw;
}

.series {
    z-index: 4;
}

.series .single-container {
    margin-top: 120px;
    margin-left: 3em;
}

.series .single-container img {
    max-width: 30vw;
}

.preview {
   display: flex;
   align-items: center;
   position: fixed;
   right: 0;
}

.count  {
    position: absolute;
    right: 10px;
    bottom: 30px;
    user-select: none;
    display: flex;
    justify-content: flex-end;
    line-height: 1.4em;
}

.masonry .count {
    bottom: -50px;
}

.unfold mwc-icon, .count mwc-icon {
    opacity: .5;
    cursor: pointer;
    transition: opacity .3s linear;
}

.count mwc-icon.disabled {
    opacity: 0 !important;
    cursor: default;
}

.unfold mwc-icon:hover, .count mwc-icon:hover {
    opacity: 1;
}

.count .pagination {
    display: inline;
}

.progress {
    position: absolute;
    bottom: 0;
    width: 50vw;
}

.progress mwc-linear {
    width: 50vw;
}

.single-cat {
    display: inline;
    cursor: crosshair;
}

.selected .big {
    background-image: linear-gradient(120deg, #002Fa7 0%, #8fd3f4 100%);
    background-repeat: no-repeat;
    background-size: 100% 0.1em;
    background-position: 25px 88%;
    transition: all 0.25s ease-out;
}

.masonry {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    grid-gap: 3px;
    grid-auto-rows: minmax(180px, auto);
    grid-auto-flow: dense;
    padding: 10px;
    margin-top: 80px;
}

.masonry .item {
    cursor: pointer;
}
`;