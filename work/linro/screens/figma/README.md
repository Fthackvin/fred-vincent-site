# Linro screens, for Figma

`violations.svg`, `agent.svg`, `simulate.svg` — the three product screens as
SVG. Drag one into Figma and it arrives as editable vectors with the text as
real text, not an image.

They are generated, not drawn: `../to-svg.js` walks the rendered screen and
writes what the browser actually laid out, so they cannot drift away from the
HTML. To regenerate after a change, open a screen with `?bare`, and in the
console:

    document.documentElement.style.width = '1280px';
    document.body.style.width = '1280px';
    await LinroPrefetch();
    copy(LinroToSVG());

Paste into a `.svg` file. The two width lines matter: without them you export
whatever width the window happens to be, and the case study embeds at 1280.

`preview.html` renders all three so a bad export is visible immediately.

Known: text runs that sit inline with an element — `test-agent acquired
<em>admin</em> beyond granted scope` — become separate text layers positioned
where the browser put them. They line up when the font matches (Figma has
Inter) and drift slightly when it does not.
