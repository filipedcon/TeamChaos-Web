// Variáveis globais
let teamMembers = [];
let champions = [];
let currentTurnIndex = 0;

// Elementos DOM
const memberNameInput = document.getElementById('memberName');
const addMemberButton = document.getElementById('addMember');
const membersList = document.getElementById('membersList');
const randomizeOrderButton = document.getElementById('randomizeOrder');
const teamAssignment = document.getElementById('teamAssignment');
const resetButton = document.getElementById('resetAll');
const saveButton = document.getElementById('saveTeam');
const notification = document.getElementById('notification');
const loadingChampions = document.getElementById('loadingChampions');

// Modal
const assignModal = document.getElementById('assignModal');
const closeModalBtn = document.querySelector('.close');
const modalTitle = document.getElementById('modalTitle');
const roleSelect = document.getElementById('roleSelect');
const modalChampions = document.getElementById('modalChampions');

let modalAssignIndex = null;
let modalChampionsList = [];

// Carregar campeões do arquivo TXT
async function loadChampions() {
    try {
        const response = await fetch('champions.txt');
        if (!response.ok) {
            throw new Error('Arquivo de campeões não encontrado.');
        }
        const text = await response.text();
        champions = text.split('\n')
            .map(champ => champ.trim())
            .filter(champ => champ !== '')
            .map(champ => {
                return champ.split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
            });
        console.log(`Carregados ${champions.length} campeões`);
    } catch (error) {
        console.error('Erro ao carregar campeões:', error);
        showNotification('Erro ao carregar lista de campeões. Verifique se o arquivo champions.txt existe.');
        champions = [
            "Aatrox", "Ahri", "Akali", "Alistar", "Amumu", "Anivia", "Annie", "Aphelios", "Ashe", "Aurelion Sol",
            "Azir", "Bard", "Blitzcrank", "Brand", "Braum", "Caitlyn", "Camille", "Cassiopeia", "Cho'Gath", "Corki"
        ];
    } finally {
        loadingChampions.style.display = 'none';
    }
}

// Adicionar membro ao time
function addTeamMember() {
    const name = memberNameInput.value.trim();
    if (!name) {
        showNotification('Por favor, insira um nome para o membro do time.');
        return;
    }
    if (teamMembers.length >= 5) {
        showNotification('O time já possui 5 membros. Não é possível adicionar mais.');
        return;
    }
    
    teamMembers.push({ 
        name, 
        champion: null, 
        role: null,
        order: teamMembers.length + 1
    });
    
    renderMembersList();
    renderTeamAssignment();
    memberNameInput.value = '';
    memberNameInput.focus();
}

// Renderizar lista de membros
function renderMembersList() {
    membersList.innerHTML = '';
    teamMembers.forEach((member, index) => {
        const memberElement = document.createElement('div');
        memberElement.className = 'team-member';
        memberElement.innerHTML = `
            <div class="member-info">
                <span class="member-name">${member.name}</span>
                <span class="member-role">${member.role || 'Role não definida'}</span>
            </div>
            <button class="button remove-member" data-index="${index}">Remover</button>
        `;
        membersList.appendChild(memberElement);
    });
    
    document.querySelectorAll('.remove-member').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            teamMembers.splice(index, 1);
            updateMembersOrder();
            renderMembersList();
            renderTeamAssignment();
        });
    });
}

// Atualizar ordem dos membros
function updateMembersOrder() {
    teamMembers.forEach((member, index) => {
        member.order = index + 1;
    });
}

// Randomizar ordem dos membros
function randomizeOrder() {
    if (teamMembers.length === 0) {
        showNotification('Adicione membros ao time antes de randomizar a ordem.');
        return;
    }
    
    // Embaralhar array
    for (let i = teamMembers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [teamMembers[i], teamMembers[j]] = [teamMembers[j], teamMembers[i]];
    }
    
    // Atualizar ordem
    updateMembersOrder();
    
    // Resetar turno atual
    currentTurnIndex = 0;
    
    renderTeamAssignment();
    showNotification('Ordem do time randomizada!');
}

// Renderizar atribuição de time
function renderTeamAssignment() {
    teamAssignment.innerHTML = '';
    
    // Ordenar membros por ordem
    const sortedMembers = [...teamMembers].sort((a, b) => a.order - b.order);
    
    sortedMembers.forEach((member, index) => {
        const isCurrentTurn = index === currentTurnIndex && member.champion === null;
        const memberElement = document.createElement('div');
        memberElement.className = `team-member ${isCurrentTurn ? 'current-turn' : ''}`;
        memberElement.innerHTML = `
            <div class="member-order">${member.order}</div>
            <div class="member-info">
                <span class="member-name">${member.name}</span>
                <span class="member-role">${member.role || 'Role não definida'}</span>
            </div>
            <div class="assigned-champion">${member.champion || 'Sem campeão'}</div>
            <button class="button assign-champion" data-index="${teamMembers.indexOf(member)}">
                ${member.champion ? 'Alterar' : 'Atribuir'}
            </button>
        `;
        teamAssignment.appendChild(memberElement);
    });
    
    document.querySelectorAll('.assign-champion').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            openAssignModal(index);
        });
    });
}

// Abrir modal de atribuição
function openAssignModal(index) {
    modalAssignIndex = index;
    const member = teamMembers[index];
    modalTitle.textContent = `Atribuir campeão para ${member.name}`;
    
    // Resetar role selection
    roleSelect.value = member.role || 'top';
    
    // Sortear 5 campeões diferentes
    modalChampionsList = [...champions]
        .filter(champ => !teamMembers.some(m => m.champion === champ)) // Remove campeões já atribuídos
        .sort(() => 0.5 - Math.random())
        .slice(0, 5);
    
    renderModalChampions();
    assignModal.style.display = 'flex';
}

// Renderizar campeões no modal
function renderModalChampions() {
    modalChampions.innerHTML = '';
    modalChampionsList.forEach(champion => {
        const championCard = document.createElement('div');
        championCard.className = 'champion-card-modal';
        championCard.innerHTML = `<div class="champion-name-modal">${champion}</div>`;
        championCard.addEventListener('click', function() {
            // Desselecionar outros
            document.querySelectorAll('.champion-card-modal').forEach(card => {
                card.classList.remove('selected');
            });
            // Selecionar este
            this.classList.add('selected');
            
            // Atribuir campeão e role
            assignChampionToMember(champion, roleSelect.value);
        });
        modalChampions.appendChild(championCard);
    });
}

// Fechar modal
function closeAssignModal() {
    assignModal.style.display = 'none';
    modalAssignIndex = null;
    modalChampionsList = [];
}

// Atribuir campeão ao membro
function assignChampionToMember(champion, role) {
    if (modalAssignIndex === null) return;
    
    const member = teamMembers[modalAssignIndex];
    member.champion = champion;
    member.role = role;
    
    // Avançar para o próximo membro sem campeão
    advanceToNextMember();
    
    renderTeamAssignment();
    closeAssignModal();
    showNotification(`${member.name} agora é ${role} com ${champion}!`);
}

// Avançar para o próximo membro sem campeão
function advanceToNextMember() {
    const sortedMembers = [...teamMembers].sort((a, b) => a.order - b.order);
    const nextIndex = sortedMembers.findIndex((member, index) => 
        index > currentTurnIndex && member.champion === null
    );
    
    if (nextIndex !== -1) {
        currentTurnIndex = nextIndex;
    } else {
        // Todos têm campeões ou é o último
        currentTurnIndex = 0;
    }
}

// Reiniciar tudo
function resetAll() {
    teamMembers = [];
    currentTurnIndex = 0;
    renderMembersList();
    teamAssignment.innerHTML = '';
    memberNameInput.value = '';
    showNotification('Todos os dados foram reiniciados.');
}

// Salvar time
function saveTeam() {
    if (teamMembers.length === 0) {
        showNotification('Adicione membros ao time antes de salvar.');
        return;
    }
    
    const allMembersHaveChampions = teamMembers.every(member => member.champion !== null);
    if (!allMembersHaveChampions) {
        showNotification('Atribua campeões a todos os membros antes de salvar.');
        return;
    }
    
    const teamData = {
        date: new Date().toLocaleString('pt-BR'),
        members: teamMembers.sort((a, b) => a.order - b.order)
    };
    
    const dataStr = JSON.stringify(teamData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `time-lol-${new Date().getTime()}.json`;
    link.click();
    
    showNotification('Time salvo com sucesso! Arquivo baixado.');
}

// Mostrar notificação
function showNotification(message) {
    notification.textContent = message;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Event listeners
addMemberButton.addEventListener('click', addTeamMember);
memberNameInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addTeamMember();
    }
});
randomizeOrderButton.addEventListener('click', randomizeOrder);
resetButton.addEventListener('click', resetAll);
saveButton.addEventListener('click', saveTeam);
closeModalBtn.addEventListener('click', closeAssignModal);
window.addEventListener('click', function(event) {
    if (event.target === assignModal) closeAssignModal();
});

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', function() {
    loadChampions();
});