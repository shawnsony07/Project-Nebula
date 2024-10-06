var text = document.getElementById('text');
var newDom = '';
var animationDelay = 15;

for(let i = 0; i < text.innerText.length; i++)
{
    newDom += '<span class="char">' + (text.innerText[i] == ' ' ? '&nbsp;' : text.innerText[i])+ '</span>';
}

text.innerHTML = newDom;
var length = text.children.length;
text.children[0].style['animation-delay'] = '3s';
for(let i = 1; i < length; i++)
{
    text.children[i].style['animation-delay'] = 3000+i*animationDelay + 'ms';
}

