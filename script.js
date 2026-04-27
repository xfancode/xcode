const SYSTEM_FILES = ['index.html', 'style.css', 'script.js'];

let projectName = localStorage.getItem('xcode_project') || prompt('Введите название проекта:', 'мой-проект');
if (!projectName) projectName = 'проект';
projectName = projectName.toLowerCase().replace(/[^a-zа-я0-9]/gi, '-');

let files = {};
let currentFile = 'index.html';

function loadFromStorage() {
    const savedFiles = localStorage.getItem(projectName + '_files');
    if (savedFiles) {
        files = JSON.parse(savedFiles);
    } else {
        files = {
            'index.html': '<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <title>Мой проект</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <h1>Привет, мир!</h1>\n    <script src="script.js"><\/script>\n</body>\n</html>',
            'style.css': 'body {\n    font-family: sans-serif;\n    margin: 40px;\n    background: #f0f0f0;\n}\n\nh1 {\n    color: #333;\n}',
            'script.js': 'console.log(\'Привет\');'
        };
    }
}

function saveToStorage() {
    localStorage.setItem(projectName + '_files', JSON.stringify(files));
}

function renderFileList() {
    const fileList = document.getElementById('fileList');
    if (!fileList) return;
    fileList.innerHTML = '';
    
    const sortedFiles = Object.keys(files).sort((a, b) => {
        const aIsSystem = SYSTEM_FILES.includes(a);
        const bIsSystem = SYSTEM_FILES.includes(b);
        if (aIsSystem && !bIsSystem) return -1;
        if (!aIsSystem && bIsSystem) return 1;
        return a.localeCompare(b);
    });
    
    sortedFiles.forEach(filename => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item' + (SYSTEM_FILES.includes(filename) ? ' system-file' : '');
        if (filename === currentFile) fileItem.classList.add('active');
        
        let icon = '📄';
        if (filename.endsWith('.html')) icon = '🌐';
        else if (filename.endsWith('.css')) icon = '🎨';
        else if (filename.endsWith('.js')) icon = '⚙️';
        else if (filename.endsWith('.json')) icon = '📋';
        else if (filename.endsWith('.txt')) icon = '📝';
        
        let lang = filename.split('.').pop().toUpperCase();
        
        fileItem.innerHTML = `
            <span class="icon">${icon}</span>
            <span class="name" title="${filename}">${filename}</span>
            <span class="lang">${lang}</span>
            ${!SYSTEM_FILES.includes(filename) ? '<span class="delete-btn" onclick="deleteFile(\'' + filename + '\')">🗑️</span>' : ''}
        `;
        
        fileItem.onclick = (e) => {
            if (!e.target.classList.contains('delete-btn')) {
                switchFile(filename);
            }
        };
        
        fileList.appendChild(fileItem);
    });
    
    const projectNameDisplay = document.getElementById('projectNameDisplay');
    const projectNameStatus = document.getElementById('projectNameStatus');
    if (projectNameDisplay) projectNameDisplay.innerText = projectName;
    if (projectNameStatus) projectNameStatus.innerHTML = '📁 ' + projectName;
}

function switchFile(filename) {
    const editor = document.getElementById('codeEditor');
    if (editor && currentFile) {
        files[currentFile] = editor.value;
    }
    
    currentFile = filename;
    if (editor) editor.value = files[filename] || '';
    
    const currentFileName = document.getElementById('currentFileName');
    if (currentFileName) currentFileName.innerText = '📄 ' + filename;
    
    renderFileList();
    updateCharCount();
}

function updateCharCount() {
    const editor = document.getElementById('codeEditor');
    const charCount = document.getElementById('charCount');
    if (editor && charCount) {
        charCount.innerText = editor.value.length;
    }
}

function onEditorChange() {
    const editor = document.getElementById('codeEditor');
    if (editor) {
        files[currentFile] = editor.value;
        updateCharCount();
        saveToStorage();
    }
}

function addNewFile() {
    const filename = prompt('Введите имя файла с расширением (например, data.json):');
    if (!filename) return;
    if (files[filename]) {
        alert('Файл с таким именем уже существует!');
        return;
    }
    
    let content = '';
    if (filename.endsWith('.html')) content = '<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <title>Новая страница</title>\n</head>\n<body>\n    \n</body>\n</html>';
    else if (filename.endsWith('.css')) content = '/* Стили */\n\n';
    else if (filename.endsWith('.js')) content = '// JavaScript код\n\n';
    
    files[filename] = content;
    saveToStorage();
    renderFileList();
    switchFile(filename);
}

function deleteFile(filename) {
    if (SYSTEM_FILES.includes(filename)) {
        alert('Системные файлы нельзя удалить!');
        return;
    }
    
    if (confirm(`Вы точно хотите удалить файл "${filename}"?`)) {
        delete files[filename];
        saveToStorage();
        if (currentFile === filename) {
            switchFile('index.html');
        } else {
            renderFileList();
        }
    }
}

function saveAsZIP() {
    const editor = document.getElementById('codeEditor');
    if (editor) files[currentFile] = editor.value;
    
    const zip = new JSZip();
    Object.keys(files).forEach(filename => {
        zip.file(filename, files[filename]);
    });
    zip.generateAsync({ type: 'blob' }).then(content => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = projectName + '.zip';
        a.click();
        URL.revokeObjectURL(a.href);
    });
    const saveOptions = document.getElementById('saveOptions');
    if (saveOptions) saveOptions.classList.remove('show');
}

function saveAsHTML() {
    if (!currentFile.endsWith('.html')) {
        alert('Можно сохранить как HTML только HTML-файлы!');
        return;
    }
    const editor = document.getElementById('codeEditor');
    if (editor) files[currentFile] = editor.value;
    
    const blob = new Blob([files[currentFile]], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = currentFile;
    a.click();
    URL.revokeObjectURL(a.href);
    
    const saveOptions = document.getElementById('saveOptions');
    if (saveOptions) saveOptions.classList.remove('show');
}

function runCode() {
    if (!currentFile.endsWith('.html')) {
        alert('Запустить можно только HTML-файлы!');
        return;
    }
    const editor = document.getElementById('codeEditor');
    if (editor) files[currentFile] = editor.value;
    
    const newWindow = window.open('', '_blank');
    if (newWindow) {
        newWindow.document.write(files[currentFile]);
        newWindow.document.close();
    }
}

function confirmClear() {
    if (confirm('Вы точно хотите очистить редактор?')) {
        const editor = document.getElementById('codeEditor');
        if (editor) {
            editor.value = '';
            files[currentFile] = '';
            updateCharCount();
            saveToStorage();
        }
    }
}

function startRename() {
    const newName = prompt('Введите новое название проекта:', projectName);
    if (newName && newName.trim() !== '') {
        const oldName = projectName;
        projectName = newName.toLowerCase().replace(/[^a-zа-я0-9]/gi, '-');
        if (oldName !== projectName) {
            localStorage.setItem(projectName + '_files', JSON.stringify(files));
            localStorage.removeItem(oldName + '_files');
        }
        localStorage.setItem('xcode_project', projectName);
        renderFileList();
        
        const projectNameStatus = document.getElementById('projectNameStatus');
        if (projectNameStatus) projectNameStatus.innerHTML = '📁 ' + projectName;
    }
}

function toggleSaveMenu() {
    const saveOptions = document.getElementById('saveOptions');
    if (saveOptions) saveOptions.classList.toggle('show');
}

loadFromStorage();
renderFileList();
switchFile('index.html');

window.onclick = function(event) {
    const saveOptions = document.getElementById('saveOptions');
    if (saveOptions && !event.target.matches('.btn') && !event.target.matches('.save-option')) {
        saveOptions.classList.remove('show');
    }
};