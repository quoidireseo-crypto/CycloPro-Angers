const fs = require('fs');

function replaceColors(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(/#F5F5F0/g, '#F8F6F2');
  content = content.replace(/#141414/g, '#0F1A15');
  content = content.replace(/#5A5A40/g, '#E04A26');
  content = content.replace(/#4A4A30/g, '#B83A1C');
  content = content.replace(/#A5A58D/g, '#B07D6D');
  fs.writeFileSync(filePath, content, 'utf-8');
}

replaceColors('src/App.tsx');
replaceColors('src/components/OnboardingFlow.tsx');
console.log('Colors replaced successfully');
