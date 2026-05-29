import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './index.css'

function ExpandEntry({ icon, text, link }) {
    return (
        <>
            <a href={ link } target="_blank" rel="noopener noreferrer">
                <p className='expand'><i className={ `nf nf-${ icon }` } /> { text }</p>
            </a>
        </>
    )
}

function Header({ page, sub }) {
    return (
        <>
            <h1><Link to="/" className='pride'>jwas</Link>{ page && (<>/<i>{ page }</i> </>) }</h1>
            { sub && <h3>{ sub }</h3> }
        </>
    );
}

function EntryList({ entries }) {
    return (
        <>
            { entries.map(e => <ExpandEntry icon={ e.icon } text={ e.text } link={ e.link } />) }
        </>
    );
}

const contactLinks = [
    {
        icon: "md-mail",
        text: "e-mail",
        link: "mailto:admin@jwas.pl"
    }, {
        icon: "fae-telegram",
        text: "telegram",
        link: "https://t.me/kierunek"
    },
]

const rootLinks = [
    {
        icon: "dev-github",
        text: "github",
        link: "https://github.com/JulWas797"
    }, {
        icon: "md-mail",
        text: "contact",
        link: "/contact"
    }, {
        icon: "md-folder",
        text: "projects",
        link: "/projects"
    }
];

const projectsLinks = [
    {
        icon: "oct-hourglass",
        text: "jtimebomb",
        link: "https://github.com/julwas797/jtimebomb"
    }, {
        icon: "fa-question",
        text: "(soon)",
        link: ""
    }
]

function Root() {
    return(
        <>
            <Header sub="hobbyist software developmer" />
            <EntryList entries={ rootLinks } />
            <footer>(C) { new Date().getFullYear() } jwas.pl</footer>
        </>
    )
}

function Contact() {
    return(
        <>
            <Header page="contact" sub="feel free to reach me out!" />
            <EntryList entries={ contactLinks } />
        </>
    )
}

function Error404() {
    return(
        <>
            <Header page="404" sub="page not found!" />
        </>
    )
}

function Projects() {
    return(
        <>
            <Header page="projects" sub="my projects" />
            <EntryList entries={ projectsLinks } />
        </>
    )
}

function EasterEgg() {
    return(
        <>
            <Header page="meow" sub="^w^" />
            <h2>meow :3</h2>
        </>
    )
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/contact" element={ <Contact /> } />
                <Route path="/projects" element={ <Projects /> } />
                <Route path="/meow" element={ <EasterEgg /> } />
                <Route path="/" element={ <Root /> } />
                <Route path="*" element={ <Error404 /> } />
            </Routes>
        </BrowserRouter>
    </StrictMode>
)
