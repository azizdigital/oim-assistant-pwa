	var reportHistory = [];
        var fullReportHistory = [];
        var performanceDeck = [];
        var dailyActivities = [];
        var vvEntries = [];
        var hitchObjectives = [];
        var focusAreas = [];
        var currentHitchStartDate = '';
        var lastHitchCheck = '';
        var currentView = 'daily';
        var currentTab = 'basic';
        var currentHistoryTab = 'whatsapp';
        var hitchStartDate = '2025-05-21';
        var availableWorkGroups = ['Operations', 'Maintenance', 'HMM Construction', 'HMM Painting', 'QC Team', 'Others'];
        var selectedStatusFilters = [];
        var defaultDailyActivityGroups = ['Operations', 'CMPE', 'HMM Construction', 'HMM Painting', 'QC Team'];
        var wellsData = {
            iba: { total: 17, flowing: 0 },
            ibb: { total: 5, flowing: 0 },
            ibc: { total: 6, flowing: 0 }
        };

        // ==================================================
        // CUSTOM PROMPT FOR ELECTRON
        // ==================================================
        var promptResolve = null;

        function customPrompt(message, defaultValue) {
            return new Promise(function(resolve) {
                promptResolve = resolve;
                
                document.getElementById('promptTitleText').textContent = message;
                document.getElementById('promptInput').value = defaultValue || '';
                
                var modal = document.getElementById('customPromptModal');
                modal.classList.add('show');
                
                setTimeout(function() {
                    document.getElementById('promptInput').focus();
                    document.getElementById('promptInput').select();
                }, 100);
            });
        }

        function confirmCustomPrompt() {
            var value = document.getElementById('promptInput').value.trim();
            closeCustomPrompt();
            
            if (promptResolve) {
                promptResolve(value || null);
                promptResolve = null;
            }
        }

        function cancelCustomPrompt() {
            closeCustomPrompt();
            
            if (promptResolve) {
                promptResolve(null);
                promptResolve = null;
            }
        }

        function closeCustomPrompt() {
            var modal = document.getElementById('customPromptModal');
            modal.classList.remove('show');
            document.getElementById('promptInput').value = '';
        }

        document.addEventListener('DOMContentLoaded', function() {
            var promptInput = document.getElementById('promptInput');
            if (promptInput) {
                promptInput.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        confirmCustomPrompt();
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        cancelCustomPrompt();
                    }
                });
            }

            var modal = document.getElementById('customPromptModal');
            if (modal) {
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        cancelCustomPrompt();
                    }
                });
            }
        });

        function openTodaysChampion() {
            var newWindow = window.open('meme.html', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
            if (!newWindow) {
                showAlert("🏆 Today's Champion feature requires meme.html file to be accessible!", 'warning');
            } else {
                setTimeout(function() {
                    try {
                        if (newWindow.closed || newWindow.location.href === 'about:blank') {
                            newWindow.close();
                            showAlert('🏆 meme.html file not found! Please make sure the file exists in the same directory.', 'warning');
                        }
                    } catch (e) {
                        showAlert('🎉 Today\'s Champion opened successfully!', 'success');
                    }
                }, 100);
            }
        }

		// HITCH PLANNING FUNCTIONS
        function checkHitchCycle() {
            var date = document.getElementById('operationDate').value;
            if (!date) return;
            
            var selectedDate = new Date(date);
            var startDate = new Date(hitchStartDate);
            var daysDiff = Math.floor((selectedDate - startDate) / (1000 * 60 * 60 * 24));
            var cyclePosition = ((daysDiff % 28) + 28) % 28;
            
            var titleEl = document.getElementById('hitchPlanningStatusTitle');
            var subtitleEl = document.getElementById('hitchPlanningStatusSubtitle');
            var warningEl = document.getElementById('hitchOffDutyWarning');
            var addObjectiveBtn = document.getElementById('addObjectiveBtn');
            var addFocusAreaBtn = document.getElementById('addFocusAreaBtn');
            
            if (cyclePosition < 14) {
                var dayInHitch = cyclePosition + 1;
                var week = dayInHitch <= 7 ? 1 : 2;
                var dayInWeek = dayInHitch <= 7 ? dayInHitch : dayInHitch - 7;
                
                titleEl.textContent = '✅ ON DUTY - Week ' + week + ', Day ' + dayInWeek;
                subtitleEl.textContent = (14 - cyclePosition) + ' days remaining until demobilization';
                warningEl.classList.add('hidden');
                
                if (addObjectiveBtn) addObjectiveBtn.disabled = false;
                if (addFocusAreaBtn) addFocusAreaBtn.disabled = false;
                
                if (currentHitchStartDate !== date || lastHitchCheck !== date) {
                    currentHitchStartDate = date;
                    lastHitchCheck = date;
                }
            } else {
                var dayOff = cyclePosition - 13;
                titleEl.textContent = '🏖️ OFF DUTY - Day ' + dayOff + ' of 14';
                subtitleEl.textContent = (28 - cyclePosition) + ' days until next mobilization';
                warningEl.classList.remove('hidden');
                
                if (addObjectiveBtn) addObjectiveBtn.disabled = true;
                if (addFocusAreaBtn) addFocusAreaBtn.disabled = true;
            }
        }

        async function addHitchObjective() {
            var description = await customPrompt('Enter objective description:', '');
            if (!description) return;
            
            var newObjective = {
                id: Date.now(),
                description: description,
                progress: 0,
                remarks: []
            };
            
            hitchObjectives.push(newObjective);
            renderHitchObjectives();
            saveData();
            showAlert('✅ Hitch objective added!', 'success');
        }

        function removeHitchObjective(id) {
            if (confirm('Remove this objective?')) {
                hitchObjectives = hitchObjectives.filter(function(obj) { return obj.id !== id; });
                renderHitchObjectives();
                saveData();
            }
        }

        function updateHitchObjectiveProgress(id, progress) {
            var obj = hitchObjectives.find(function(o) { return o.id === id; });
            if (obj) {
                obj.progress = parseInt(progress);
                renderHitchObjectives();
            }
        }

        function addRemarkToObjective(id) {
            var input = document.getElementById('remarkInput-' + id);
            var remark = input.value.trim();
            
            if (!remark) {
                showAlert('Please enter a remark', 'warning');
                return;
            }
            
            var obj = hitchObjectives.find(function(o) { return o.id === id; });
            if (obj) {
                obj.remarks.push({
                    date: new Date().toISOString().split('T')[0],
                    text: remark
                });
                input.value = '';
                renderHitchObjectives();
                saveData();
                showAlert('✅ Remark added!', 'success');
            }
        }

        function renderHitchObjectives() {
            var container = document.getElementById('hitchObjectivesContainer');
            if (hitchObjectives.length === 0) {
                container.innerHTML = '<p style="color:#64748b;text-align:center;padding:40px">No hitch objectives yet. Click "Add Objective" to create your first objective.</p>';
                return;
            }
            
            var html = '';
            for (var i = 0; i < hitchObjectives.length; i++) {
                var obj = hitchObjectives[i];
                html += '<div class="hitch-objective-card">' +
                    '<div class="hitch-objective-header">' +
                        '<div class="hitch-objective-number">' + (i + 1) + '</div>' +
                        '<button class="btn btn-danger" onclick="removeHitchObjective(' + obj.id + ')" style="padding:4px 8px;font-size:0.75rem">🗑️</button>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label>Objective Description</label>' +
                        '<textarea class="form-control" rows="2" readonly>' + obj.description + '</textarea>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label>Progress: <span style="color:#3b82f6;font-weight:700">' + obj.progress + '%</span></label>' +
                        '<input type="range" class="form-control" min="0" max="100" value="' + obj.progress + '" onchange="updateHitchObjectiveProgress(' + obj.id + ', this.value)" style="height:8px">' +
                    '</div>';
                
                html += '<div class="hitch-remark-input-container">' +
                    '<input type="text" id="remarkInput-' + obj.id + '" class="form-control hitch-remark-input" placeholder="Add daily remark or update...">' +
                    '<button class="btn btn-primary" onclick="addRemarkToObjective(' + obj.id + ')">➕ Add</button>' +
                '</div>';
                
                if (obj.remarks && obj.remarks.length > 0) {
                    html += '<div class="hitch-remarks-history">';
                    for (var j = obj.remarks.length - 1; j >= 0; j--) {
                        var remark = obj.remarks[j];
                        html += '<div class="hitch-remark-item">' +
                            '<span class="hitch-remark-date">' + remark.date + ':</span>' +
                            '<span class="hitch-remark-text">' + remark.text + '</span>' +
                        '</div>';
                    }
                    html += '</div>';
                }
                
                html += '</div>';
            }
            
            container.innerHTML = html;
        }

        async function addFocusArea() {
            var area = await customPrompt('Enter focus area:', '');
            if (!area) return;
            
            var newFocus = {
                id: Date.now(),
                area: area,
                remarks: []
            };
            
            focusAreas.push(newFocus);
            renderFocusAreas();
            saveData();
            showAlert('✅ Focus area added!', 'success');
        }

        function removeFocusArea(id) {
            if (confirm('Remove this focus area?')) {
                focusAreas = focusAreas.filter(function(f) { return f.id !== id; });
                renderFocusAreas();
                saveData();
            }
        }

        function addRemarkToFocus(id) {
            var input = document.getElementById('focusRemarkInput-' + id);
            var remark = input.value.trim();
            
            if (!remark) {
                showAlert('Please enter a remark', 'warning');
                return;
            }
            
            var focus = focusAreas.find(function(f) { return f.id === id; });
            if (focus) {
                focus.remarks.push({
                    date: new Date().toISOString().split('T')[0],
                    text: remark
                });
                input.value = '';
                renderFocusAreas();
                saveData();
                showAlert('✅ Remark added!', 'success');
            }
        }

        function renderFocusAreas() {
            var container = document.getElementById('focusAreasContainer');
            if (focusAreas.length === 0) {
                container.innerHTML = '<p style="color:#64748b;text-align:center;padding:40px">No focus areas yet. Click "Add Focus Area" to create your first focus area.</p>';
                return;
            }
            
            var html = '';
            for (var i = 0; i < focusAreas.length; i++) {
                var focus = focusAreas[i];
                html += '<div class="hitch-focus-card">' +
                    '<div class="hitch-focus-header">' +
                        '<h4 style="color:#1e40af;margin:0">🔍 ' + focus.area + '</h4>' +
                        '<button class="btn btn-danger" onclick="removeFocusArea(' + focus.id + ')" style="padding:4px 8px;font-size:0.75rem">🗑️</button>' +
                    '</div>';
                
                html += '<div class="hitch-remark-input-container">' +
                    '<input type="text" id="focusRemarkInput-' + focus.id + '" class="form-control hitch-remark-input" placeholder="Add daily observation or update...">' +
                    '<button class="btn btn-primary" onclick="addRemarkToFocus(' + focus.id + ')">➕ Add</button>' +
                '</div>';
                
                if (focus.remarks && focus.remarks.length > 0) {
                    html += '<div class="hitch-remarks-history">';
                    for (var j = focus.remarks.length - 1; j >= 0; j--) {
                        var remark = focus.remarks[j];
                        html += '<div class="hitch-remark-item">' +
                            '<span class="hitch-remark-date">' + remark.date + ':</span>' +
                            '<span class="hitch-remark-text">' + remark.text + '</span>' +
                        '</div>';
                    }
                    html += '</div>';
                }
                
                html += '</div>';
            }
            
            container.innerHTML = html;
        }

        function saveHitchPlanning() {
            saveData();
            showAlert('💾 Hitch planning saved successfully!', 'success');
        }

        // DAILY ACTIVITY FUNCTIONS
        function loadDailyActivitiesForDate() {
            var date = document.getElementById('operationDate').value;
            if (!date) return;
            
            document.getElementById('dailyActivityDate').textContent = new Date(date).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            
            renderDailyActivityCards();
        }

function renderDailyActivityCards() {
    var date = document.getElementById('operationDate').value;
    if (!date) return;
    
    var container = document.getElementById('dailyActivityContainer');
    var dateActivities = dailyActivities.filter(function(a) { return a.date === date; });
    
    document.getElementById('dailyActivityDate').textContent = new Date(date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    // ✅ FIX: Check existing data first - including custom groups
    if (dateActivities.length === 0) {
        // Calculate previous day
        var currentDate = new Date(date);
        var previousDate = new Date(currentDate);
        previousDate.setDate(previousDate.getDate() - 1);
        var prevDateStr = previousDate.toISOString().split('T')[0];
        
        // Get previous day's activities (ALL groups)
        var prevDayActivities = dailyActivities.filter(function(a) { return a.date === prevDateStr; });
        
        // ✅ NEW: If previous day has data, copy ALL groups (default + custom)
        if (prevDayActivities.length > 0) {
            for (var i = 0; i < prevDayActivities.length; i++) {
                var prevGroup = prevDayActivities[i];
                dailyActivities.push({
                    id: Date.now() + i,
                    date: date,
                    groupName: prevGroup.groupName,
                    supervisorName: prevGroup.supervisorName,
                    totalMembers: prevGroup.totalMembers,
                    activity: '' // Always empty for new day
                });
            }
            showAlert('📋 All groups copied from ' + prevDateStr + ' (including custom groups)', 'info');
        } else {
            // No previous data - create default groups only
            for (var i = 0; i < defaultDailyActivityGroups.length; i++) {
                dailyActivities.push({
                    id: Date.now() + i,
                    date: date,
                    groupName: defaultDailyActivityGroups[i],
                    supervisorName: '',
                    totalMembers: '',
                    activity: ''
                });
            }
        }
        
        // Refresh filtered data
        dateActivities = dailyActivities.filter(function(a) { return a.date === date; });
    }
    
    // Render cards
    var html = '';
    for (var i = 0; i < dateActivities.length; i++) {
        var item = dateActivities[i];
        var isDefault = defaultDailyActivityGroups.indexOf(item.groupName) !== -1;
        
        html += '<div class="activity-card">' +
            '<div class="activity-card-header">' +
                '<div class="activity-card-title">' +
                    '<span class="activity-card-icon">' + getGroupIcon(item.groupName) + '</span>' +
                    item.groupName +
                '</div>' +
                (!isDefault ? '<button class="btn btn-danger" onclick="removeDailyActivityGroup(' + item.id + ')" style="padding:4px 8px;font-size:0.75rem;">🗑️</button>' : '') +
            '</div>' +
            
            '<div class="activity-card-compact-row">' +
                '<div class="form-group">' +
                    '<label>Supervisor Name</label>' +
                    '<input type="text" class="form-control" value="' + (item.supervisorName || '') + '" onchange="updateDailyActivity(' + item.id + ',\'supervisorName\',this.value)" placeholder="Enter supervisor name">' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>Members</label>' +
                    '<input type="number" class="form-control" value="' + (item.totalMembers || '') + '" onchange="updateDailyActivity(' + item.id + ',\'totalMembers\',this.value)" placeholder="0" min="0" style="text-align: center;">' +
                '</div>' +
            '</div>' +
            
            '<div class="form-group" style="margin-bottom: 0;">' +
                '<label>Activity</label>' +
                '<textarea class="form-control" rows="4" onchange="updateDailyActivity(' + item.id + ',\'activity\',this.value)" placeholder="Describe daily activities for this group...">' + (item.activity || '') + '</textarea>' +
            '</div>' +
        '</div>';
    }
    
    container.innerHTML = html;
}

        function getGroupIcon(groupName) {
            var icons = {
                'Operations': '🛢️',
                'CMPE': '⚙️',
                'HMM Construction': '🏗️',
                'HMM Painting': '🎨',
                'QC Team': '✅',
                'Wellwork': '🔧',
                'HIT Team': '👷',
                'QC Structure': '📐',
                'Medic / RO': '🏥',
                'Catering': '🍽️',
                'SSE/Clerk': '📋',
                'Maintenance': '🔩'
            };
            return icons[groupName] || '📂';
        }

function addDailyActivityGroup() {
            var groupName = document.getElementById('newGroupName').value.trim();
            if (!groupName) {
                showAlert('Please enter a group name', 'warning');
                return;
            }
            
            var date = document.getElementById('operationDate').value;
            if (!date) {
                showAlert('Please select an operation date first', 'warning');
                return;
            }
            
            var exists = dailyActivities.some(function(a) {
                return a.date === date && a.groupName === groupName;
            });
            
            if (exists) {
                showAlert('Group "' + groupName + '" already exists for this date', 'warning');
                return;
            }
            
            // ✨ NEW: Try to find this group from previous day
            var currentDate = new Date(date);
            var previousDate = new Date(currentDate);
            previousDate.setDate(previousDate.getDate() - 1);
            var prevDateStr = previousDate.toISOString().split('T')[0];
            
            var prevGroup = dailyActivities.find(function(a) {
                return a.date === prevDateStr && a.groupName === groupName;
            });
            
            // Add new group with copied supervisor & members if exists
            dailyActivities.push({
                id: Date.now(),
                date: date,
                groupName: groupName,
                supervisorName: prevGroup ? prevGroup.supervisorName : '',
                totalMembers: prevGroup ? prevGroup.totalMembers : '',
                activity: '' // Always empty for new day
            });
            
            document.getElementById('newGroupName').value = '';
            renderDailyActivityCards();
            
            if (prevGroup && (prevGroup.supervisorName || prevGroup.totalMembers)) {
                showAlert('✅ Group "' + groupName + '" added with previous day\'s supervisor & members!', 'success');
            } else {
                showAlert('✅ Group "' + groupName + '" added successfully!', 'success');
            }
        }

        function removeDailyActivityGroup(id) {
            if (confirm('Remove this activity group?')) {
                dailyActivities = dailyActivities.filter(function(a) { return a.id !== id; });
                renderDailyActivityCards();
                showAlert('Group removed', 'info');
            }
        }

        function updateDailyActivity(id, field, value) {
            var activity = dailyActivities.find(function(a) { return a.id === id; });
            if (activity) activity[field] = value;
        }

        function saveDailyActivities() {
            saveData();
            showAlert('💾 Daily activities saved successfully!', 'success');
        }

        function generateDailyActivitiesSection() {
            var date = document.getElementById('operationDate').value;
            if (!date) return 'No daily activities recorded.';
            
            var dateActivities = dailyActivities.filter(function(a) {
                return a.date === date && (a.supervisorName || a.activity);
            });
            
            if (dateActivities.length === 0) return 'No daily activities recorded for this date.';
            
            var section = 'Date: ' + new Date(date).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric'
            }) + '\n\n';
            
            for (var i = 0; i < dateActivities.length; i++) {
                var item = dateActivities[i];
                section += item.groupName.toUpperCase();
                if (item.supervisorName || item.totalMembers) {
                    section += ' (';
                    if (item.supervisorName) section += 'Supervisor: ' + item.supervisorName;
                    if (item.supervisorName && item.totalMembers) section += ', ';
                    if (item.totalMembers) section += item.totalMembers + ' pax';
                    section += ')';
                }
                section += '\n';
                if (item.activity) section += item.activity + '\n';
                section += '\n';
            }
            
            return section.trim();
        }

        // WELLS MANAGEMENT FUNCTIONS
        function updateWellsCapacity(platform) {
            var totalInput = document.getElementById(platform + 'TotalWells');
            var newTotal = parseInt(totalInput.value) || 1;
            
            if (newTotal < 1) {
                newTotal = 1;
                totalInput.value = 1;
                showAlert('⚠️ Minimum wells capacity is 1', 'warning');
            }
            if (newTotal > 50) {
                newTotal = 50;
                totalInput.value = 50;
                showAlert('⚠️ Maximum wells capacity is 50', 'warning');
            }
            
            wellsData[platform].total = newTotal;
            document.getElementById(platform + 'MaxDisplay').textContent = newTotal;
            document.getElementById(platform + 'FlowingWells').setAttribute('max', newTotal);
            
            var currentFlowing = parseInt(document.getElementById(platform + 'FlowingWells').value) || 0;
            if (currentFlowing > newTotal) {
                document.getElementById(platform + 'FlowingWells').value = newTotal;
                wellsData[platform].flowing = newTotal;
                showAlert('⚠️ Flowing wells adjusted to match new total capacity', 'info');
            }
            
            updateTotalFlowingWells();
            showAlert('✅ ' + platform.toUpperCase() + ' wells capacity updated to ' + newTotal + ' wells', 'success');
        }

        function updateTotalFlowingWells() {
            var ibaFlowing = parseInt(document.getElementById('ibaFlowingWells').value) || 0;
            var ibbFlowing = parseInt(document.getElementById('ibbFlowingWells').value) || 0;
            var ibcFlowing = parseInt(document.getElementById('ibcFlowingWells').value) || 0;

            var ibaMax = wellsData.iba.total;
            var ibbMax = wellsData.ibb.total;
            var ibcMax = wellsData.ibc.total;

            if (ibaFlowing > ibaMax) {
                document.getElementById('ibaFlowingWells').value = ibaMax;
                ibaFlowing = ibaMax;
                showAlert('⚠️ IbA maximum wells is ' + ibaMax, 'warning');
            }
            if (ibbFlowing > ibbMax) {
                document.getElementById('ibbFlowingWells').value = ibbMax;
                ibbFlowing = ibbMax;
                showAlert('⚠️ IbB maximum wells is ' + ibbMax, 'warning');
            }
            if (ibcFlowing > ibcMax) {
                document.getElementById('ibcFlowingWells').value = ibcMax;
                ibcFlowing = ibcMax;
                showAlert('⚠️ IbC maximum wells is ' + ibcMax, 'warning');
            }

            wellsData.iba.flowing = ibaFlowing;
            wellsData.ibb.flowing = ibbFlowing;
            wellsData.ibc.flowing = ibcFlowing;

            document.getElementById('ibaWellsDisplay').textContent = ibaFlowing;
            document.getElementById('ibbWellsDisplay').textContent = ibbFlowing;
            document.getElementById('ibcWellsDisplay').textContent = ibcFlowing;

            var total = ibaFlowing + ibbFlowing + ibcFlowing;
            document.getElementById('totalFlowingWells').textContent = total;
            document.getElementById('headerTotalWells').textContent = total;

            updateWellInputColors();
        }

        function updateWellInputColors() {
            var platforms = ['iba', 'ibb', 'ibc'];
            for (var i = 0; i < platforms.length; i++) {
                var platform = platforms[i];
                var input = document.getElementById(platform + 'FlowingWells');
                var flowing = parseInt(input.value) || 0;
                var total = wellsData[platform].total;
                var percentage = (flowing / total) * 100;

                input.classList.remove('green', 'yellow', 'red');
                if (percentage === 0) {}
                else if (percentage <= 50) input.classList.add('red');
                else if (percentage <= 80) input.classList.add('yellow');
                else input.classList.add('green');
            }
        }

        // POB FUNCTIONS
        function updatePOB() {
            var pcsb = parseInt(document.getElementById('pcsbStaff').value) || 0;
            var contractor = parseInt(document.getElementById('contractorStaff').value) || 0;
            var vessel = parseInt(document.getElementById('vesselPOB').value) || 0;
            
            var platform = pcsb + contractor;
            document.getElementById('platformPOB').value = platform;
            
            var total = platform + vessel;
            document.getElementById('totalPOB').value = total;
            document.getElementById('headerPOB').textContent = total;
            
            var platformInput = document.getElementById('platformPOB');
            var pobAlert = document.getElementById('pobOverflowAlert');
            
            platformInput.classList.remove('green', 'yellow', 'red');
            pobAlert.classList.add('hidden');
            
            if (platform > 98) {
                platformInput.classList.add('red');
                var overflow = platform - 98;
                pobAlert.innerHTML = '⚠️ Platform POB exceeds maximum capacity by ' + overflow + ' personnel. Immediate action required!';
                pobAlert.classList.remove('hidden');
            } else if (platform > 95) {
                platformInput.classList.add('red');
                pobAlert.innerHTML = '🚨 Platform POB approaching maximum capacity. Monitor closely.';
                pobAlert.classList.remove('hidden');
            } else if (platform >= 85) {
                platformInput.classList.add('yellow');
            } else if (platform > 0) {
                platformInput.classList.add('green');
            }
            
            calculateTomorrowPOB();
        }

        function toggleVessel() {
            var isChecked = document.getElementById('vesselPresent').checked;
            var vesselSection = document.getElementById('vesselSection');
            if (isChecked) {
                vesselSection.classList.add('active');
            } else {
                vesselSection.classList.remove('active');
                document.getElementById('vesselName').value = '';
                document.getElementById('vesselPOB').value = '';
                updatePOB();
            }
        }

        function toggleCCB() {
            var isChecked = document.getElementById('tomorrowCCB').checked;
            var ccbSection = document.getElementById('ccbSection');
            if (isChecked) {
                ccbSection.classList.add('active');
            } else {
                ccbSection.classList.remove('active');
                document.getElementById('incomingCrew').value = '';
                document.getElementById('outgoingCrew').value = '';
                document.getElementById('tomorrowPOB').value = '';
            }
        }

        function calculateTomorrowPOB() {
            var ccbChecked = document.getElementById('tomorrowCCB').checked;
            if (!ccbChecked) return;
            var currentPlatformPOB = parseInt(document.getElementById('platformPOB').value) || 0;
            var incoming = parseInt(document.getElementById('incomingCrew').value) || 0;
            var outgoing = parseInt(document.getElementById('outgoingCrew').value) || 0;
            document.getElementById('tomorrowPOB').value = currentPlatformPOB + incoming - outgoing;
        }

        // MEDICAL & EVENTS FUNCTIONS
        function toggleMedicalUpdate() {
            var isChecked = document.getElementById('hasMedicalUpdate').checked;
            var section = document.getElementById('medicalUpdateSection');
            if (isChecked) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
                document.getElementById('medicalUpdateDetails').value = '';
            }
        }

        function toggleSignificantEvents() {
            var isChecked = document.getElementById('hasSignificantEvents').checked;
            var section = document.getElementById('significantEventsSection');
            if (isChecked) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
                document.getElementById('significantEventsDetails').value = '';
            }
        }

        function handleMedicalCompanyChange() {
            var select = document.getElementById('medicalCompany');
            var otherInput = document.getElementById('medicalCompanyOther');
            if (select.value === 'Others') {
                otherInput.classList.remove('hidden');
                otherInput.focus();
            } else {
                otherInput.classList.add('hidden');
                otherInput.value = '';
            }
        }

        function handleEventTypeChange() {
            var select = document.getElementById('eventType');
            var otherInput = document.getElementById('eventTypeOther');
            if (select.value === 'Others') {
                otherInput.classList.remove('hidden');
                otherInput.focus();
            } else {
                otherInput.classList.add('hidden');
                otherInput.value = '';
            }
        }

        // WEATHER FUNCTIONS
        function updateOilConversion() {
            var oilActual = parseFloat(document.getElementById('oilActual').value) || 0;
            var oilTarget = parseFloat(document.getElementById('oilTarget').value) || 0;
            var conversionDisplay = document.getElementById('oilConversionDisplay');
            
            if (oilActual > 0 || oilTarget > 0) {
                var actualKBD = ((oilActual / 159.12) * 0.881).toFixed(1);
                var targetKBD = ((oilTarget / 159.12) * 0.881).toFixed(1);
                var displayText = '';
                if (oilActual > 0 && oilTarget > 0) {
                    displayText = '📊 Converted: ' + actualKBD + ' vs ' + targetKBD + ' KBD (with shrinkage factor 0.881)';
                } else if (oilActual > 0) {
                    displayText = '📊 Converted: ' + actualKBD + ' KBD (with shrinkage factor 0.881)';
                } else if (oilTarget > 0) {
                    displayText = '📊 Target: ' + targetKBD + ' KBD (with shrinkage factor 0.881)';
                }
                conversionDisplay.innerHTML = displayText;
                conversionDisplay.classList.remove('hidden');
            } else {
                conversionDisplay.classList.add('hidden');
            }
        }

        function updateSwellComment() {
            var swellMin = parseFloat(document.getElementById('swellHeightMin').value) || 0;
            var swellMax = parseFloat(document.getElementById('swellHeightMax').value) || swellMin;
            var commentDiv = document.getElementById('swellComment');
            var avgSwell = (swellMin + swellMax) / 2;
            var description;
            if (avgSwell === 0) { description = "Calm"; }
            else if (avgSwell <= 0.1) { description = "Calm"; }
            else if (avgSwell <= 0.5) { description = "Smooth"; }
            else if (avgSwell <= 1.25) { description = "Slight"; }
            else if (avgSwell <= 2.5) { description = "Moderate"; }
            else if (avgSwell <= 4) { description = "Rough"; }
            else if (avgSwell <= 6) { description = "Very Rough"; }
            else if (avgSwell <= 9) { description = "High"; }
            else if (avgSwell <= 14) { description = "Very High"; }
            else { description = "Phenomenal"; }
            if (swellMin > 0 || swellMax > 0) {
                commentDiv.innerHTML = '🌊 Sea Condition: ' + description + ' (Avg: ' + avgSwell.toFixed(1) + 'm)';
                commentDiv.classList.remove('hidden');
            } else {
                commentDiv.classList.add('hidden');
            }
        }

        function updateWindComment() {
            var windMin = parseFloat(document.getElementById('windSpeedMin').value) || 0;
            var windMax = parseFloat(document.getElementById('windSpeedMax').value) || windMin;
            var commentDiv = document.getElementById('windComment');
            var avgWind = (windMin + windMax) / 2;
            var description;
            if (avgWind < 1) { description = "Calm"; }
            else if (avgWind <= 3) { description = "Light Air"; }
            else if (avgWind <= 6) { description = "Light Breeze"; }
            else if (avgWind <= 10) { description = "Gentle Breeze"; }
            else if (avgWind <= 16) { description = "Moderate Breeze"; }
            else if (avgWind <= 21) { description = "Fresh Breeze"; }
            else if (avgWind <= 27) { description = "Strong Breeze"; }
            else if (avgWind <= 33) { description = "Near Gale"; }
            else if (avgWind <= 40) { description = "Gale"; }
            else { description = "Strong Gale"; }
            if (windMin > 0 || windMax > 0) {
                commentDiv.innerHTML = '💨 Wind Condition: ' + description + ' (Avg: ' + avgWind.toFixed(1) + ' knots)';
                commentDiv.classList.remove('hidden');
            } else {
                commentDiv.classList.add('hidden');
            }
        }

        function toggleBoatInputs() {
            var boatInputs = document.getElementById('boatInputs');
            var location = document.getElementById('boatLocation').value;
            var timeLabel = document.getElementById('boatTimeLabel');
            if (location === 'In Vicinity') {
                boatInputs.classList.remove('hidden');
                timeLabel.textContent = 'On Location Until';
            } else if (location && location !== '') {
                boatInputs.classList.remove('hidden');
                timeLabel.textContent = 'ETA';
            } else {
                boatInputs.classList.add('hidden');
                document.getElementById('boatName').value = '';
                document.getElementById('boatETA').value = '';
            }
            updateBoatComments();
        }

        function toggleSectorBoatInputs() {
            var sectorInputs = document.getElementById('sectorBoatInputs');
            var plan = document.getElementById('sectorBoatPlan').value;
            if (plan === 'Plan') {
                sectorInputs.classList.remove('hidden');
            } else {
                sectorInputs.classList.add('hidden');
                document.getElementById('sectorBoatName').value = '';
                document.getElementById('sectorBoatETA').value = '';
            }
            updateBoatComments();
        }

        function updateBoatComments() {
            var location = document.getElementById('boatLocation').value;
            var boatName = document.getElementById('boatName').value;
            var boatETA = document.getElementById('boatETA').value;
            var sectorPlan = document.getElementById('sectorBoatPlan').value;
            var sectorBoatName = document.getElementById('sectorBoatName').value;
            var sectorBoatETA = document.getElementById('sectorBoatETA').value;
            var boatComment = document.getElementById('boatComment');
            var sectorComment = document.getElementById('sectorBoatComment');
            
            if (location && boatName) {
                var comment = '';
                var timeInfo = '';
                if (boatETA) {
                    var etaDate = new Date(boatETA);
                    var timeStr = etaDate.toLocaleString('en-GB', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                    });
                    timeInfo = ' (' + timeStr + ')';
                }
                switch (location) {
                    case 'In Vicinity': comment = '🚤 ' + boatName + ' standing by in vicinity for operational support' + timeInfo; break;
                    case 'At Semangkuk': comment = '🚤 ' + boatName + ' currently at Semangkuk platform' + timeInfo; break;
                    case 'At Dulang': comment = '🚤 ' + boatName + ' currently at Dulang platform' + timeInfo; break;
                    case 'Maintenance': comment = '🔧 ' + boatName + ' undergoing scheduled maintenance' + timeInfo; break;
                }
                boatComment.innerHTML = comment;
                boatComment.classList.remove('hidden');
            } else {
                boatComment.classList.add('hidden');
            }
            
            if (sectorPlan === 'Plan' && sectorBoatName) {
                var sectorTimeInfo = '';
                if (sectorBoatETA) {
                    var sectorEtaDate = new Date(sectorBoatETA);
                    var sectorTimeStr = sectorEtaDate.toLocaleString('en-GB', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                    });
                    sectorTimeInfo = ' (ETA: ' + sectorTimeStr + ')';
                }
                sectorComment.innerHTML = '🚤 ' + sectorBoatName + ' scheduled for sector operations as planned' + sectorTimeInfo;
                sectorComment.classList.remove('hidden');
            } else if (sectorPlan === 'No Plan') {
                sectorComment.innerHTML = '⚠️ No sector boat operations planned';
                sectorComment.classList.remove('hidden');
            } else {
                sectorComment.classList.add('hidden');
            }
        }

        // PRODUCTION FUNCTIONS
        function updateProductionComments() {
            var oil = parseFloat(document.getElementById('oilActual').value) || 0;
            var oilTarget = parseFloat(document.getElementById('oilTarget').value) || 0;
            var gas = parseFloat(document.getElementById('gasActual').value) || 0;
            var gasTarget = parseFloat(document.getElementById('gasTarget').value) || 0;
            var flare = parseFloat(document.getElementById('flareActual').value) || 0;
            var flareTarget = parseFloat(document.getElementById('flareTarget').value) || 0;

            var productionLossReason = document.getElementById('productionLossReason');
            var gasLossReason = document.getElementById('gasLossReason');
            var flareExceedReason = document.getElementById('flareExceedReason');

            if (oil >= oilTarget) productionLossReason.classList.add('hidden');
            else productionLossReason.classList.remove('hidden');

            if (gas >= gasTarget) gasLossReason.classList.add('hidden');
            else gasLossReason.classList.remove('hidden');

            if (flare <= flareTarget) flareExceedReason.classList.add('hidden');
            else flareExceedReason.classList.remove('hidden');

            var commentHTML = '';
            if (oilTarget > 0) {
                var oilPerf = (oil / oilTarget) * 100;
                var comment = oilPerf >= 100 ? 'Excellent performance!' : oilPerf >= 95 ? 'Good performance' : 'Needs attention';
                commentHTML += '<strong>Oil Production:</strong> ' + comment + '<br>';
            }
            if (gasTarget > 0) {
                var gasPerf = (gas / gasTarget) * 100;
                var comment = gasPerf >= 100 ? 'Target achieved' : gasPerf >= 95 ? 'Close to target' : 'Action required';
                commentHTML += '<strong>Gas Injection:</strong> ' + comment + '<br>';
            }
            if (flareTarget > 0) {
                var comment = flare <= flareTarget ? 'Within limits' : 'Exceeded target';
                commentHTML += '<strong>Flare:</strong> ' + comment;
            }

            var commentDiv = document.getElementById('productionComments');
            commentDiv.innerHTML = commentHTML;
            if (commentHTML) commentDiv.classList.remove('hidden');
            else commentDiv.classList.add('hidden');
        }

        function validateOperatingHours(platform) {
            var hours = parseFloat(document.getElementById(platform + 'Hours').value) || 0;
            var reasonSection = document.getElementById(platform + 'ReasonSection');
            if (hours > 0 && hours < 24) reasonSection.classList.remove('hidden');
            else reasonSection.classList.add('hidden');
        }

        function updateWatercutColor() {
            var watercutInput = document.getElementById('watercut');
            var watercutPlan = document.getElementById('watercutPlan');
            var watercutComment = document.getElementById('watercutComment');
            var watercutExceedReason = document.getElementById('watercutExceedReason');
            var value = parseFloat(watercutInput.value);
            
            watercutInput.classList.remove('green', 'yellow', 'red');
            watercutPlan.classList.add('hidden');
            watercutComment.classList.add('hidden');
            watercutExceedReason.classList.add('hidden');
            
            if (isNaN(value) || value < 0) return;

            if (value < 7) {
                watercutInput.classList.add('green');
                watercutComment.innerHTML = '✅ Optimal watercut level. Excellent water management.';
                watercutComment.classList.remove('hidden');
            } else if (value >= 7 && value < 10) {
                watercutInput.classList.add('yellow');
                watercutComment.innerHTML = '⚠️ Moderate watercut level. Monitor water production closely.';
                watercutComment.classList.remove('hidden');
            } else if (value >= 10) {
                watercutInput.classList.add('red');
                watercutPlan.classList.remove('hidden');
                watercutExceedReason.classList.remove('hidden');
            }
        }

        // V&V FUNCTIONS
        function addVVEntry() {
            var vvEntry = { id: Date.now(), doneBy: '', group: '', comment: '' };
            vvEntries.push(vvEntry);
            renderVVEntries();
        }

        function removeVVEntry(id) {
            vvEntries = vvEntries.filter(function(entry) { return entry.id !== id; });
            renderVVEntries();
        }

        function updateVVEntry(id, field, value) {
            var entry = vvEntries.find(function(e) { return e.id === id; });
            if (entry) {
                entry[field] = value;
                if (field === 'doneBy' || field === 'group') renderVVEntries();
            }
        }

        function renderVVEntries() {
            var container = document.getElementById('vvEntriesContainer');
            if (vvEntries.length === 0) {
                container.innerHTML = '<p style="color:#64748b;text-align:center;padding:20px">No V&V entries yet. Click "Add V&V" to create entries.</p>';
                return;
            }
            
            var html = '';
            for (var i = 0; i < vvEntries.length; i++) {
                var entry = vvEntries[i];
                html += '<div class="vv-entry">' +
                    '<div class="form-grid">' +
                        '<div class="form-group"><label>V&V Done By</label>' +
                            '<input type="text" class="form-control" value="' + entry.doneBy + '" onchange="updateVVEntry(' + entry.id + ',\'doneBy\',this.value)" placeholder="Enter person name">' +
                        '</div>' +
                        '<div class="form-group"><label>Group/Department</label>' +
                            '<input type="text" class="form-control" value="' + entry.group + '" onchange="updateVVEntry(' + entry.id + ',\'group\',this.value)" placeholder="Enter group/department">' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<button class="btn btn-danger" onclick="removeVVEntry(' + entry.id + ')">🗑️ Remove</button>' +
                        '</div>' +
                    '</div>';
                
                if (entry.doneBy && entry.group) {
                    html += '<div class="form-group"><label>V&V Comment / Remark</label>' +
                        '<textarea class="form-control" rows="2" onchange="updateVVEntry(' + entry.id + ',\'comment\',this.value)" placeholder="Add V&V comment or remark here...">' + entry.comment + '</textarea>' +
                    '</div>';
                } else {
                    html += '<p style="color:#64748b;font-size:13px;margin-top:8px">Please fill "Done By" and "Group" first to add comment.</p>';
                }
                html += '</div>';
            }
            container.innerHTML = html;
        }

        // PERFORMANCE DECK FUNCTIONS
        var debugMode = false;

        function toggleDebugMode() {
            debugMode = !debugMode;
            var btn = document.getElementById('debugToggle');
            if (debugMode) {
                btn.innerHTML = '🔧 Debug ON';
                btn.classList.remove('btn-info');
                btn.classList.add('btn-warning');
                showAlert('🔧 Debug mode enabled - Check browser console for detailed logs', 'info');
            } else {
                btn.innerHTML = '🔧 Debug Mode';
                btn.classList.remove('btn-warning');
                btn.classList.add('btn-info');
            }
        }

        function debugLog() {
            if (debugMode) console.log.apply(console, arguments);
        }

        function showImportGuide() {
            document.getElementById('importGuideModal').classList.remove('hidden');
        }

        function hideImportGuide() {
            document.getElementById('importGuideModal').classList.add('hidden');
        }

        function showImportStatus(message, type) {
            var statusDiv = document.getElementById('importStatus');
            statusDiv.className = 'file-import-status status-' + type;
            statusDiv.textContent = message;
            statusDiv.classList.remove('hidden');
        }

        function showImportPreview(data) {
            var previewDiv = document.getElementById('importPreview');
            previewDiv.innerHTML = '<strong>Preview (first 3 rows):</strong><br>' + data;
            previewDiv.classList.remove('hidden');
        }

        function importPerformanceFromExcel(event) {
            var file = event.target.files[0];
            if (!file) return;
            showImportStatus('📄 Reading Excel file...', 'importing');
            var reader = new FileReader();
            reader.onload = function(e) {
                try {
                    var data = new Uint8Array(e.target.result);
                    var workbook = XLSX.read(data, { type: 'array' });
                    var firstSheetName = workbook.SheetNames[0];
                    var worksheet = workbook.Sheets[firstSheetName];
                    var jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    if (jsonData.length < 2) {
                        showImportStatus('⚠ File appears to be empty or invalid', 'error');
                        return;
                    }
                    var imported = processImportedPerformanceData(jsonData);
                    showImportStatus('✅ Successfully imported ' + imported + ' performance items from Excel!', 'imported');
                } catch (error) {
                    console.error('Excel import error:', error);
                    showImportStatus('⚠ Error reading Excel file: ' + error.message, 'error');
                }
            };
            reader.readAsArrayBuffer(file);
            event.target.value = '';
        }

        function importPerformanceFromCSV(event) {
            var file = event.target.files[0];
            if (!file) return;
            showImportStatus('📄 Reading CSV file...', 'importing');
            var reader = new FileReader();
            reader.onload = function(e) {
                try {
                    var csvText = e.target.result;
                    var results = Papa.parse(csvText, {
                        header: false,
                        skipEmptyLines: true,
                        dynamicTyping: true
                    });
                    if (!results.data || results.data.length < 2) {
                        showImportStatus('⚠ CSV file appears to be empty or invalid', 'error');
                        return;
                    }
                    var imported = processImportedPerformanceData(results.data);
                    showImportStatus('✅ Successfully imported ' + imported + ' performance items from CSV!', 'imported');
                } catch (error) {
                    console.error('CSV import error:', error);
                    showImportStatus('⚠ Error reading CSV file: ' + error.message, 'error');
                }
            };
            reader.readAsText(file);
            event.target.value = '';
        }

        function processImportedPerformanceData(data) {
            if (!data || data.length < 2) return 0;
            var headers = data[0];
            var rows = data.slice(1);
            debugLog('Processing imported data:', 'Headers:', headers, 'First few rows:', rows.slice(0, 3));
            var colMap = detectColumns(headers);
            if (colMap.description === -1) {
                showImportStatus('⚠ Could not find Description column. Please check your file format.', 'error');
                return 0;
            }
            var preview = [];
            var importedCount = 0;
            for (var i = 0; i < Math.min(rows.length, 100); i++) {
                var row = rows[i];
                if (!row || row.length === 0) continue;
                debugLog('Processing row ' + i + ':', row);
                var description = getColumnValue(row, colMap.description);
                debugLog('Extracted description:', description);
                if (!description || description.trim() === '') {
                    debugLog('Skipping row ' + i + ' - no description');
                    continue;
                }
                var workGroup = getColumnValue(row, colMap.workGroup) || 'Others';
                var priority = normalizeParameter(getColumnValue(row, colMap.priority) || 'Medium', ['high', 'medium', 'low'], 'medium');
                var progress = normalizeProgress(getColumnValue(row, colMap.progress) || 0);
                var startDate = normalizeDate(getColumnValue(row, colMap.startDate));
                var endDate = normalizeDate(getColumnValue(row, colMap.endDate));
                debugLog('Processed values:', { description: description, workGroup: workGroup, priority: priority, progress: progress, startDate: startDate, endDate: endDate });
                if (availableWorkGroups.indexOf(workGroup) === -1) availableWorkGroups.push(workGroup);
                var newItem = {
                    id: Date.now() + i,
                    description: description.trim(),
                    workGroup: workGroup.trim(),
                    priority: priority,
                    status: getStatusFromProgress(progress),
                    progress: progress,
                    startDate: startDate,
                    endDate: endDate
                };
                debugLog('Created performance item:', newItem);
                performanceDeck.push(newItem);
                importedCount++;
                if (i < 3) {
                    var previewText = description + ' (' + workGroup + ', ' + priority + ', ' + progress + '%)';
                    if (startDate || endDate) previewText += ' [' + (startDate || 'No start') + ' to ' + (endDate || 'No end') + ']';
                    preview.push(previewText);
                }
            }
            if (preview.length > 0) showImportPreview(preview.join('<br>'));
            updatePerformanceGroupFilter();
            renderPerformanceDeck();
            saveData();
            return importedCount;
        }

        function detectColumns(headers) {
            var colMap = { description: -1, workGroup: -1, priority: -1, progress: -1, startDate: -1, endDate: -1 };
            debugLog('Detecting columns from headers:', headers);
            for (var i = 0; i < headers.length; i++) {
                var header = String(headers[i]).toLowerCase().trim();
                debugLog('Checking header ' + i + ':', header);
                if (header === 'description' || header.includes('description') || header.includes('task') || header.includes('activity')) {
                    if (colMap.description === -1) {
                        colMap.description = i;
                        debugLog('Found description column at index:', i);
                    }
                }
                else if (header === 'work group' || header === 'workgroup' || header.includes('group') || header.includes('team') || header.includes('department') || header.includes('unit')) {
                    if (colMap.workGroup === -1) {
                        colMap.workGroup = i;
                        debugLog('Found work group column at index:', i);
                    }
                }
                else if (header === 'priority' || header.includes('priority') || header.includes('importance')) {
                    if (colMap.priority === -1) {
                        colMap.priority = i;
                        debugLog('Found priority column at index:', i);
                    }
                }
                else if (header === 'completion' || header === 'progress' || header === 'status' || header.includes('progress') || header.includes('completion') || header.includes('percent') || header.includes('%')) {
                    if (colMap.progress === -1) {
                        colMap.progress = i;
                        debugLog('Found progress column at index:', i);
                    }
                }
                else if (header === 'start date' || header === 'startdate' || header.includes('start') && header.includes('date')) {
                    if (colMap.startDate === -1) {
                        colMap.startDate = i;
                        debugLog('Found start date column at index:', i);
                    }
                }
                else if (header === 'end date' || header === 'enddate' || header === 'due date' || header === 'duedate' || (header.includes('end') || header.includes('due')) && header.includes('date')) {
                    if (colMap.endDate === -1) {
                        colMap.endDate = i;
                        debugLog('Found end date column at index:', i);
                    }
                }
            }
            debugLog('Final column mapping:', colMap);
            return colMap;
        }

        function normalizeDate(value) {
            if (!value) return '';
            var dateStr = String(value).trim();
            if (!dateStr) return '';
            debugLog('Normalizing date:', dateStr, 'Type:', typeof value);
            var date;
            if (/^\d{4,6}$/.test(dateStr)) {
                var serialNumber = parseInt(dateStr);
                if (serialNumber > 0 && serialNumber < 100000) {
                    debugLog('Detected Excel serial number:', serialNumber);
                    var excelEpoch = new Date(1900, 0, 1);
                    var msPerDay = 24 * 60 * 60 * 1000;
                    date = new Date(excelEpoch.getTime() + (serialNumber - 2) * msPerDay);
                    debugLog('Converted Excel serial to date:', date.toISOString().split('T')[0]);
                } else {
                    debugLog('Serial number out of reasonable range:', serialNumber);
                    return '';
                }
            }
            else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                date = new Date(dateStr);
                debugLog('Parsed ISO format:', dateStr);
            }
            else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
                var parts = dateStr.split('/');
                if (parseInt(parts[0]) <= 31 && parseInt(parts[1]) <= 12) {
                    date = new Date(parts[2] + '-' + parts[1].padStart(2, '0') + '-' + parts[0].padStart(2, '0'));
                    debugLog('Parsed DD/MM/YYYY format:', dateStr);
                } else {
                    date = new Date(parts[2] + '-' + parts[0].padStart(2, '0') + '-' + parts[1].padStart(2, '0'));
                    debugLog('Parsed MM/DD/YYYY format:', dateStr);
                }
            }
            else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateStr)) {
                var parts = dateStr.split('-');
                date = new Date(parts[2] + '-' + parts[0].padStart(2, '0') + '-' + parts[1].padStart(2, '0'));
                debugLog('Parsed MM-DD-YYYY format:', dateStr);
            }
            else {
                date = new Date(dateStr);
                debugLog('Parsed using JavaScript Date constructor:', dateStr);
            }
            if (isNaN(date.getTime())) {
                debugLog('⚠ Invalid date format:', dateStr);
                return '';
            }
            var year = date.getFullYear();
            if (year < 1970 || year > 2050) {
                debugLog('⚠ Date year out of reasonable range:', year, 'for input:', dateStr);
                return '';
            }
            var result = date.toISOString().split('T')[0];
            debugLog('✅ Final normalized date:', result);
            return result;
        }

        function getColumnValue(row, colIndex) {
            if (colIndex === -1 || !row || colIndex >= row.length) {
                debugLog('getColumnValue: Invalid column index', colIndex, 'for row length', row ? row.length : 'undefined');
                return '';
            }
            var value = String(row[colIndex] || '').trim();
            debugLog('getColumnValue: colIndex=' + colIndex + ', value="' + value + '"');
            return value;
        }

        function normalizeParameter(value, validOptions, defaultValue) {
            var normalized = value.toString().toLowerCase().trim();
            for (var i = 0; i < validOptions.length; i++) {
                if (normalized.includes(validOptions[i])) return validOptions[i];
            }
            return defaultValue;
        }

        function normalizeProgress(value) {
            if (!value) return 0;
            var numValue = parseFloat(String(value).replace('%', ''));
            if (isNaN(numValue)) return 0;
            if (numValue > 0 && numValue <= 1) numValue = numValue * 100;
            return Math.max(0, Math.min(100, Math.round(numValue)));
        }

        function getStatusFromProgress(progress) {
            if (progress >= 100) return 'Completed';
            if (progress > 0) return 'In Progress';
            return 'Not Started';
        }

        function updatePerformanceGroupFilter() {
            var filter = document.getElementById('performanceGroupFilter');
            var currentValue = filter.value;
            filter.innerHTML = '<option value="">All Groups</option>';
            for (var i = 0; i < availableWorkGroups.length; i++) {
                var option = document.createElement('option');
                option.value = availableWorkGroups[i];
                option.textContent = availableWorkGroups[i];
                if (availableWorkGroups[i] === currentValue) option.selected = true;
                filter.appendChild(option);
            }
        }

        async function addNewPerformanceItem() {
            var description = await customPrompt('Enter item description:', '');
            if (!description) return;
            
            var workGroup = await customPrompt('Enter work group (or type new group name):', 'Others');
            if (!workGroup) workGroup = 'Others';
            
            if (availableWorkGroups.indexOf(workGroup) === -1) {
                availableWorkGroups.push(workGroup);
                updatePerformanceGroupFilter();
            }
            
            var priority = await customPrompt('Enter priority (High/Medium/Low):', 'Medium');
            if (!priority) priority = 'Medium';
            
            var startDate = await customPrompt('Enter start date (YYYY-MM-DD) [optional]:', '');
            var endDate = await customPrompt('Enter end date (YYYY-MM-DD) [optional]:', '');
            
            if (startDate && !isValidDate(startDate)) {
                showAlert('⚠️ Invalid start date format. Use YYYY-MM-DD', 'warning');
                startDate = '';
            }
            if (endDate && !isValidDate(endDate)) {
                showAlert('⚠️ Invalid end date format. Use YYYY-MM-DD', 'warning');
                endDate = '';
            }
            
            var newItem = {
                id: Date.now(),
                description: description,
                workGroup: workGroup,
                priority: priority.toLowerCase(),
                status: 'Not Started',
                progress: 0,
                startDate: startDate,
                endDate: endDate
            };
            
            performanceDeck.push(newItem);
            renderPerformanceDeck();
            showAlert('✅ New performance item added successfully', 'success');
        }

        function isValidDate(dateString) {
            var regex = /^\d{4}-\d{2}-\d{2}$/;
            if (!regex.test(dateString)) return false;
            var date = new Date(dateString);
            var timestamp = date.getTime();
            if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) return false;
            return dateString === date.toISOString().split('T')[0];
        }

        function getDateBadge(dateString, isEndDate, progress) {
            if (!dateString) return '';
            var today = new Date();
            var targetDate = new Date(dateString);
            var diffTime = targetDate - today;
            var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            var badgeClass = '';
            var text = '';
            if (isEndDate) {
                if (diffDays < 0 && progress < 100) {
                    badgeClass = 'overdue';
                    text = Math.abs(diffDays) + (Math.abs(diffDays) === 1 ? ' day' : ' days') + ' overdue';
                } else if (diffDays === 0 && progress < 100) {
                    badgeClass = 'due-soon';
                    text = 'Due today';
                } else if (diffDays > 0 && diffDays <= 3 && progress < 100) {
                    badgeClass = 'due-soon';
                    text = 'Due in ' + diffDays + (diffDays === 1 ? ' day' : ' days');
                } else if (progress >= 100) {
                    badgeClass = 'status-completed';
                    text = 'Completed ✅';
                } else if (diffDays > 3) {
                    badgeClass = 'future';
                    text = diffDays + (diffDays === 1 ? ' day' : ' days') + ' left';
                } else {
                    return '';
                }
            } else {
                if (diffDays < 0 && progress === 0) {
                    badgeClass = 'overdue';
                    text = 'Should have started';
                } else if (diffDays === 0 && progress === 0) {
                    badgeClass = 'due-soon';
                    text = 'Starts today';
                } else if (diffDays > 0 && diffDays <= 3) {
                    badgeClass = 'due-soon';
                    text = 'Starts in ' + diffDays + (diffDays === 1 ? ' day' : ' days');
                } else if (diffDays > 3) {
                    badgeClass = 'future';
                    text = 'Starts in ' + diffDays + (diffDays === 1 ? ' day' : ' days');
                } else if (progress > 0) {
                    badgeClass = 'status-progress';
                    text = 'Work started ✅';
                } else {
                    return '';
                }
            }
            return '<span class="date-badge ' + badgeClass + '">' + text + '</span>';
        }

        function renderPerformanceDeck() {
            var tbody = document.getElementById('performanceTableBody');
            var filteredItems = getFilteredPerformanceItems();
            if (filteredItems.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 3rem; color: #64748b;">No performance items found. Use "Add New" to create items or import from Excel/CSV files.</td></tr>';
                return;
            }
            var html = '';
            for (var i = 0; i < filteredItems.length; i++) {
                var item = filteredItems[i];
                var startDateDisplay = item.startDate ? 
                    '<div>' + item.startDate + '</div>' + getDateBadge(item.startDate, false, item.progress) : 
                    '<span style="color:#94a3b8;">No start date</span>';
                var endDateDisplay = item.endDate ? 
                    '<div>' + item.endDate + '</div>' + getDateBadge(item.endDate, true, item.progress) : 
                    '<span style="color:#94a3b8;">No end date</span>';
                html += '<tr>' +
                    '<td>' + item.description + '</td>' +
                    '<td><div class="progress-container">' +
                        '<button class="progress-control-btn" onclick="adjustProgress(' + item.id + ', -5)">◀</button>' +
                        '<input type="range" min="0" max="100" value="' + item.progress + '" class="progress-slider" onchange="updateProgress(' + item.id + ', this.value)">' +
                        '<button class="progress-control-btn" onclick="adjustProgress(' + item.id + ', 5)">▶</button>' +
                        '<span class="progress-value">' + item.progress + '%</span>' +
                    '</div></td>' +
                    '<td><span class="status-badge ' + getStatusClass(item.progress) + '">' + getStatusText(item.progress) + '</span></td>' +
                    '<td><span class="priority-indicator priority-' + item.priority + '"></span>' +
                        item.priority.charAt(0).toUpperCase() + item.priority.slice(1) +
                    '</td>' +
                    '<td>' + item.workGroup + '</td>' +
                    '<td>' + startDateDisplay + '</td>' +
                    '<td>' + endDateDisplay + '</td>' +
                    '<td><button class="btn btn-danger" onclick="deletePerformanceItem(' + item.id + ')" style="padding:4px 8px;font-size:12px">🗑️</button></td>' +
                '</tr>';
            }
            tbody.innerHTML = html;
        }

        function handleNewPerformanceGroupFilter(event) {
            var newGroupInput = document.getElementById('newPerformanceGroupFilter');
            var groupFilter = document.getElementById('performanceGroupFilter');
            if (event.key === 'Enter') {
                addNewPerformanceGroup();
                return;
            }
            var typedGroup = newGroupInput.value.trim();
            if (typedGroup) {
                groupFilter.value = '';
                filterPerformanceItemsByTypedGroup(typedGroup);
            } else {
                filterPerformanceItems();
            }
        }

        function addNewPerformanceGroup() {
            var newGroupInput = document.getElementById('newPerformanceGroupFilter');
            var newGroupName = newGroupInput.value.trim();
            if (!newGroupName) {
                showAlert('Please enter a group name', 'warning');
                return;
            }
            if (availableWorkGroups.indexOf(newGroupName) !== -1) {
                showAlert('Group "' + newGroupName + '" already exists', 'warning');
                return;
            }
            availableWorkGroups.push(newGroupName);
            updatePerformanceGroupFilter();
            document.getElementById('performanceGroupFilter').value = newGroupName;
            newGroupInput.value = '';
            filterPerformanceItems();
            showAlert('✅ New group "' + newGroupName + '" added successfully!', 'success');
        }

        function filterPerformanceItemsByTypedGroup(typedGroup) {
            var searchFilter = document.getElementById('performanceSearch').value.toLowerCase();
            var filteredItems = performanceDeck.filter(function(item) {
                var matchGroup = item.workGroup.toLowerCase().includes(typedGroup.toLowerCase());
                var matchSearch = !searchFilter || item.description.toLowerCase().indexOf(searchFilter) !== -1;
                var matchStatus = selectedStatusFilters.length === 0 || selectedStatusFilters.indexOf(getStatusText(item.progress)) !== -1;
                return matchGroup && matchSearch && matchStatus;
            });
            renderFilteredPerformanceItems(filteredItems);
        }

        function renderFilteredPerformanceItems(filteredItems) {
            var tbody = document.getElementById('performanceTableBody');
            if (filteredItems.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 3rem; color: #64748b;">No performance items found matching your filter.</td></tr>';
                return;
            }
            var html = '';
            for (var i = 0; i < filteredItems.length; i++) {
                var item = filteredItems[i];
                var startDateDisplay = item.startDate ? 
                    '<div>' + item.startDate + '</div>' + getDateBadge(item.startDate, false, item.progress) : 
                    '<span style="color:#94a3b8;">No start date</span>';
                var endDateDisplay = item.endDate ? 
                    '<div>' + item.endDate + '</div>' + getDateBadge(item.endDate, true, item.progress) : 
                    '<span style="color:#94a3b8;">No end date</span>';
                html += '<tr>' +
                    '<td>' + item.description + '</td>' +
                    '<td><div class="progress-container">' +
                        '<button class="progress-control-btn" onclick="adjustProgress(' + item.id + ', -5)">◀</button>' +
                        '<input type="range" min="0" max="100" value="' + item.progress + '" class="progress-slider" onchange="updateProgress(' + item.id + ', this.value)">' +
                        '<button class="progress-control-btn" onclick="adjustProgress(' + item.id + ', 5)">▶</button>' +
                        '<span class="progress-value">' + item.progress + '%</span>' +
                    '</div></td>' +
                    '<td><span class="status-badge ' + getStatusClass(item.progress) + '">' + getStatusText(item.progress) + '</span></td>' +
                    '<td><span class="priority-indicator priority-' + item.priority + '"></span>' +
                        item.priority.charAt(0).toUpperCase() + item.priority.slice(1) +
                    '</td>' +
                    '<td>' + item.workGroup + '</td>' +
                    '<td>' + startDateDisplay + '</td>' +
                    '<td>' + endDateDisplay + '</td>' +
                    '<td><button class="btn btn-danger" onclick="deletePerformanceItem(' + item.id + ')" style="padding:4px 8px;font-size:12px">🗑️</button></td>' +
                '</tr>';
            }
            tbody.innerHTML = html;
        }

        function getFilteredPerformanceItems() {
            var groupFilter = document.getElementById('performanceGroupFilter').value;
            var newGroupFilter = document.getElementById('newPerformanceGroupFilter').value.trim().toLowerCase();
            var searchFilter = document.getElementById('performanceSearch').value.toLowerCase();
            return performanceDeck.filter(function(item) {
                var matchGroup = true;
                if (groupFilter) {
                    matchGroup = item.workGroup === groupFilter;
                } else if (newGroupFilter) {
                    matchGroup = item.workGroup.toLowerCase().includes(newGroupFilter);
                }
                var matchSearch = !searchFilter || item.description.toLowerCase().indexOf(searchFilter) !== -1;
                var matchStatus = selectedStatusFilters.length === 0 || selectedStatusFilters.indexOf(getStatusText(item.progress)) !== -1;
                return matchGroup && matchSearch && matchStatus;
            });
        }

        function filterPerformanceItems() {
            if (document.getElementById('performanceGroupFilter').value) {
                document.getElementById('newPerformanceGroupFilter').value = '';
            }
            renderPerformanceDeck();
        }

        function adjustProgress(id, change) {
            var item = performanceDeck.find(function(a) { return a.id === id; });
            if (item) {
                var newProgress = Math.max(0, Math.min(100, item.progress + change));
                item.progress = newProgress;
                if (newProgress >= 100) item.status = 'Completed';
                else if (newProgress > 0) item.status = 'In Progress';
                else item.status = 'Not Started';
                renderPerformanceDeck();
            }
        }

        function updateProgress(id, progress) {
            var item = performanceDeck.find(function(a) { return a.id === id; });
            if (item) {
                item.progress = parseInt(progress);
                if (progress >= 100) item.status = 'Completed';
                else if (progress > 0) item.status = 'In Progress';
                else item.status = 'Not Started';
                renderPerformanceDeck();
            }
        }

        function deletePerformanceItem(id) {
            if (confirm('Are you sure you want to delete this item?')) {
                performanceDeck = performanceDeck.filter(function(a) { return a.id !== id; });
                renderPerformanceDeck();
            }
        }

        function getStatusClass(progress) {
            if (progress >= 100) return 'status-completed';
            if (progress >= 1) return 'status-progress';
            return 'status-not-started';
        }

        function getStatusText(progress) {
            if (progress >= 100) return 'Completed';
            if (progress >= 1) return 'In Progress';
            return 'Not Started';
        }

        function savePerformanceDeck() {
            saveData();
            showAlert('✅ Performance items saved successfully!', 'success');
        }

        function resetPerformanceDeck() {
            if (confirm('This will delete all performance items. Continue?')) {
                performanceDeck = [];
                renderPerformanceDeck();
                showAlert('✅ Performance items reset!', 'info');
            }
        }

        function generatePerformanceDeckSection() {
            if (performanceDeck.length === 0) return 'No performance items recorded for this period.';
            var groupedItems = {};
            for (var i = 0; i < performanceDeck.length; i++) {
                var item = performanceDeck[i];
                if (!groupedItems[item.workGroup]) groupedItems[item.workGroup] = [];
                groupedItems[item.workGroup].push(item);
            }
            var section = '';
            for (var group in groupedItems) {
                if (groupedItems.hasOwnProperty(group)) {
                    section += group.toUpperCase() + ':\n';
                    var items = groupedItems[group];
                    for (var j = 0; j < items.length; j++) {
                        var item = items[j];
                        section += '• ' + item.description;
                        if (item.progress >= 100) {
                            section += ' (COMPLETED ✅)';
                            if (item.endDate) section += ' [Completed by: ' + item.endDate + ']';
                        } else {
                            section += ' (' + item.progress + '% progress)';
                            if (item.startDate && item.endDate) {
                                section += ' [' + item.startDate + ' to ' + item.endDate + ']';
                            } else if (item.startDate) {
                                section += ' [Started: ' + item.startDate + ']';
                            } else if (item.endDate) {
                                section += ' [Due: ' + item.endDate + ']';
                            }
                        }
                        section += '\n';
                    }
                    section += '\n';
                }
            }
            return section.trim();
        }

        // MULTI-SELECT DROPDOWN FUNCTIONS
        function toggleMultiselect() {
            var dropdown = document.getElementById('statusFilterDropdown');
            var arrow = document.querySelector('.multiselect-arrow');
            if (dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
                arrow.classList.remove('rotated');
            } else {
                dropdown.classList.add('show');
                arrow.classList.add('rotated');
            }
        }

        function handleStatusFilterChange() {
            var checkboxes = document.querySelectorAll('#statusFilterDropdown input[type="checkbox"]');
            var allCheckbox = document.getElementById('status-all');
            var display = document.getElementById('statusFilterDisplay');
            if (allCheckbox.checked) {
                checkboxes.forEach(function(cb) {
                    if (cb !== allCheckbox) cb.checked = false;
                });
                selectedStatusFilters = [];
                display.innerHTML = 'All Status';
            } else {
                allCheckbox.checked = false;
                selectedStatusFilters = [];
                checkboxes.forEach(function(cb) {
                    if (cb.checked && cb.value !== '') {
                        selectedStatusFilters.push(cb.value);
                    }
                });
                if (selectedStatusFilters.length === 0) {
                    allCheckbox.checked = true;
                    display.innerHTML = 'All Status';
                } else if (selectedStatusFilters.length === 1) {
                    display.innerHTML = selectedStatusFilters[0];
                } else {
                    display.innerHTML = selectedStatusFilters.length + ' statuses selected <span class="multiselect-selected-count">' + selectedStatusFilters.length + '</span>';
                }
            }
            filterPerformanceItems();
        }

        document.addEventListener('click', function(event) {
            var container = document.querySelector('.multiselect-container');
            if (container && !container.contains(event.target)) {
                var dropdown = document.getElementById('statusFilterDropdown');
                var arrow = document.querySelector('.multiselect-arrow');
                if (dropdown) dropdown.classList.remove('show');
                if (arrow) arrow.classList.remove('rotated');
            }
        });

        // REPORT GENERATION FUNCTIONS
        function generateWhatsAppContent() {
            var date = document.getElementById('operationDate').value;
            var platform = document.getElementById('platform').value;
            var platformPOB = document.getElementById('platformPOB').value || '0';
            var totalPOB = document.getElementById('totalPOB').value || '0';
            var oilKLD = parseFloat(document.getElementById('oilActual').value) || 0;
            var oilTargetKLD = parseFloat(document.getElementById('oilTarget').value) || 0;
            var gas = document.getElementById('gasActual').value || '0';
            var gasTarget = document.getElementById('gasTarget').value || '0';
            var flare = document.getElementById('flareActual').value || '0';
            var flareTarget = document.getElementById('flareTarget').value || '0';
            var watercut = document.getElementById('watercut').value || '0';
            var weather = document.getElementById('weatherCondition').value || 'Fair';
            var swellMin = document.getElementById('swellHeightMin').value || '0';
            var swellMax = document.getElementById('swellHeightMax').value || swellMin;
            var windMin = document.getElementById('windSpeedMin').value || '0';
            var windMax = document.getElementById('windSpeedMax').value || windMin;
            var recipient = document.getElementById('recipient').value || 'En. Azri & All';

            var oil = ((oilKLD / 159.12) * 0.881).toFixed(1);
            var oilTarget = ((oilTargetKLD / 159.12) * 0.881).toFixed(1);

            var oilStatus = parseFloat(oil) >= parseFloat(oilTarget) ? '✅' : '⚠️';
            var gasStatus = parseFloat(gas) >= parseFloat(gasTarget) ? '✅' : '⚠️';
            var flareStatus = parseFloat(flare) <= parseFloat(flareTarget) ? '✅' : '⚠️';

            var ibaFlowing = wellsData.iba.flowing;
            var ibbFlowing = wellsData.ibb.flowing;
            var ibcFlowing = wellsData.ibc.flowing;
            var ibaTotal = wellsData.iba.total;
            var ibbTotal = wellsData.ibb.total;
            var ibcTotal = wellsData.ibc.total;
            var totalFlowing = ibaFlowing + ibbFlowing + ibcFlowing;

            var wellsSection = '';
            if (totalFlowing > 0) {
                wellsSection = '\n*Wells Status*\n';
                wellsSection += 'Total flowing: ' + totalFlowing + ' wells\n';
                wellsSection += '• IbA: ' + ibaFlowing + '/' + ibaTotal;
                if (ibaFlowing === ibaTotal) wellsSection += ' ✅';
                else if (ibaFlowing > (ibaTotal * 0.8)) wellsSection += ' 🟡';
                else if (ibaFlowing > 0) wellsSection += ' 🔴';
                wellsSection += ' | IbB: ' + ibbFlowing + '/' + ibbTotal;
                if (ibbFlowing === ibbTotal) wellsSection += ' ✅';
                else if (ibbFlowing > (ibbTotal * 0.8)) wellsSection += ' 🟡';
                else if (ibbFlowing > 0) wellsSection += ' 🔴';
                wellsSection += ' | IbC: ' + ibcFlowing + '/' + ibcTotal;
                if (ibcFlowing === ibcTotal) wellsSection += ' ✅';
                else if (ibcFlowing > (ibcTotal * 0.8)) wellsSection += ' 🟡';
                else if (ibcFlowing > 0) wellsSection += ' 🔴';
                wellsSection += '\n• Injection: ' + (document.getElementById('injectionWells').value || '0') + ' wells\n';
            }

            var completedVV = vvEntries.filter(function(entry) {
                return entry.doneBy && entry.group && entry.comment;
            });
            var vvSection = '';
            if (completedVV.length > 0) {
                vvSection = completedVV.map(function(entry) {
                    return '• V&V by ' + entry.doneBy + ' (' + entry.group + '): ' + entry.comment;
                }).join('\n');
            } else {
                vvSection = '• Standard verification and validation procedures completed ✅';
            }

            var medicalSection = '';
            if (document.getElementById('hasMedicalUpdate').checked) {
                var name = document.getElementById('medicalPersonnelName').value;
                var company = document.getElementById('medicalCompany').value;
                var companyOther = document.getElementById('medicalCompanyOther').value;
                var condition = document.getElementById('medicalCondition').value;
                var workRelated = document.getElementById('medicalWorkRelated').value;
                var details = document.getElementById('medicalUpdateDetails').value;
                var finalCompany = company === 'Others' ? companyOther : company;
                if (name && condition) {
                    medicalSection = '\n*Medical Update:*\n';
                    medicalSection += '• Personnel: ' + name + (finalCompany ? ' (' + finalCompany + ')' : '') + '\n';
                    medicalSection += '• Condition: ' + condition + '\n';
                    if (workRelated) medicalSection += '• Work Related: ' + workRelated + '\n';
                    if (details) medicalSection += '• Details: ' + details;
                }
            }

            var eventsSection = '';
            if (document.getElementById('hasSignificantEvents').checked) {
                var eventType = document.getElementById('eventType').value;
                var eventTypeOther = document.getElementById('eventTypeOther').value;
                var eventTime = document.getElementById('eventDateTime').value;
                var eventsDetails = document.getElementById('significantEventsDetails').value;
                var finalEventType = eventType === 'Others' ? eventTypeOther : eventType;
                if (finalEventType && eventsDetails) {
                    eventsSection = '\n*Significant SHE Events:*\n';
                    eventsSection += '• Type: ' + finalEventType + '\n';
                    if (eventTime) {
                        var eventDate = new Date(eventTime);
                        eventsSection += '• Time: ' + eventDate.toLocaleString('en-GB') + '\n';
                    }
                    eventsSection += '• Details: ' + eventsDetails;
                }
            }

            var productionComments = getProductionComments();
            var operationsHighlight = document.getElementById('operationsHighlight').value;
            if (productionComments) {
                operationsHighlight += '\n\n*Production Updates:*\n' + productionComments;
            }

            var swellRange = swellMin == swellMax ? swellMin + 'm' : swellMin + '-' + swellMax + 'm';
            var windRange = windMin == windMax ? windMin + ' knots' : windMin + '-' + windMax + ' knots';
            var fDate = new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

            var pobDisplay = document.getElementById('vesselPresent').checked ? 
                totalPOB + ' pax (Platform: ' + platformPOB + ' + Vessel: ' + (document.getElementById('vesselPOB').value || '0') + ')' :
                platformPOB + ' pax';

            return 'Assalamualaikum ' + recipient + '\n\n' +
                '*' + platform + ' Operation Date:* ' + fDate + '\n' +
                '*POB:* ' + pobDisplay + ' ' + (parseInt(platformPOB) <= 95 ? '✅' : parseInt(platformPOB) > 98 ? '🚨' : '⚠️') + '\n\n' +
                '*SHE*\n' +
                document.getElementById('sheSection').value + '\n' +
                vvSection + '\n' +
                '• Near Miss: ' + (document.getElementById('nearMiss').value || '0') + ' | Incidents: ' + (document.getElementById('incidents').value || '0') + ' | UAUC: ' + (document.getElementById('uaucReported').value || '0') + 
                medicalSection + eventsSection + '\n\n' +
                '*Weather & Marine*\n' +
                '• Weather: ' + weather + ' | Swell: ' + swellRange + ' | Wind: ' + windRange + '\n\n' +
                '*Production Performance*\n' +
                '• Crude Oil: ' + oil + ' kbd vs ' + oilTarget + ' kbd (Target) ' + oilStatus + '\n' +
                '• Gas Injection: ' + gas + ' mmscf/d vs ' + gasTarget + ' mmscf/d ' + gasStatus + '\n' +
                '• Flare: ' + flare + ' mmscf/d vs ' + flareTarget + ' mmscf/d ' + flareStatus + '\n' +
                '• Watercut: ' + watercut + '% ' + (parseFloat(watercut) < 7 ? '(Optimal ✅)' : parseFloat(watercut) < 10 ? '(Monitoring ⚠️)' : '(Action Required 🚨)') + '\n' +
                wellsSection + '\n' +
                '*Operations Highlight*\n' +
                operationsHighlight + '\n\n' +
                '*Key Challenge*\n' +
                document.getElementById('keyChallenge').value + '\n\n' +
                '*Brief Summary*\n' +
                document.getElementById('briefSummary').value + '\n\n' +
                '*Aziz Mohamad - OIM Irong Barat*';
        }

        function getProductionComments() {
            var comments = [];
            var ibaHours = parseFloat(document.getElementById('ibaHours').value) || 24;
            var ibbHours = parseFloat(document.getElementById('ibbHours').value) || 24;
            var ibcHours = parseFloat(document.getElementById('ibcHours').value) || 24;
            var ibaReason = document.getElementById('ibaReason').value;
            var ibbReason = document.getElementById('ibbReason').value;
            var ibcReason = document.getElementById('ibcReason').value;
            if (ibaHours < 24 && ibaReason) comments.push('• IbA operated ' + ibaHours + ' hours - ' + ibaReason);
            if (ibbHours < 24 && ibbReason) comments.push('• IbB operated ' + ibbHours + ' hours - ' + ibbReason);
            if (ibcHours < 24 && ibcReason) comments.push('• IbC operated ' + ibcHours + ' hours - ' + ibcReason);
            var injectionWells = document.getElementById('injectionWells').value;
            var gasLiftStatus = document.getElementById('gasLiftStatus').value;
            if (injectionWells && injectionWells > 0) comments.push('• Injection Wells: ' + injectionWells + ' wells');
            if (gasLiftStatus && gasLiftStatus !== 'Operational') comments.push('• Gas Lift Status: ' + gasLiftStatus);
            var productionLossDetails = document.getElementById('productionLossDetails').value;
            var gasLossDetails = document.getElementById('gasLossDetails').value;
            var flareExceedDetails = document.getElementById('flareExceedDetails').value;
            var watercutExceedDetails = document.getElementById('watercutExceedDetails').value;
            if (productionLossDetails) comments.push('• Oil Production: ' + productionLossDetails);
            if (gasLossDetails) comments.push('• Gas Injection: ' + gasLossDetails);
            if (flareExceedDetails) comments.push('• Flare: ' + flareExceedDetails);
            if (watercutExceedDetails) comments.push('• Watercut Exceed: ' + watercutExceedDetails);
            return comments.length > 0 ? comments.join('\n') : '';
        }

        function generateFullReportContent() {
            var date = document.getElementById('operationDate').value;
            var platform = document.getElementById('platform').value;
            var platformPOB = document.getElementById('platformPOB').value || '0';
            var pcsbStaff = document.getElementById('pcsbStaff').value || '0';
            var contractorStaff = document.getElementById('contractorStaff').value || '0';
            var fDate = new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
            var platformName = platform === 'IbA' ? 'Irong Barat A' : platform === 'IbB' ? 'Irong Barat B' : 'Irong Barat C';

            var oilKLD = parseFloat(document.getElementById('oilActual').value) || 0;
            var oilTargetKLD = parseFloat(document.getElementById('oilTarget').value) || 0;
            var oilKBD = ((oilKLD / 159.12) * 0.881).toFixed(1);
            var oilTargetKBD = ((oilTargetKLD / 159.12) * 0.881).toFixed(1);

            var ibaFlowing = wellsData.iba.flowing;
            var ibbFlowing = wellsData.ibb.flowing;
            var ibcFlowing = wellsData.ibc.flowing;
            var totalFlowing = ibaFlowing + ibbFlowing + ibcFlowing;
            var totalWells = wellsData.iba.total + wellsData.ibb.total + wellsData.ibc.total;

            var wellsDetailSection = 'WELLS STATUS:\n';
            wellsDetailSection += 'Total Wells: ' + totalWells + ' wells (IbA: ' + wellsData.iba.total + ', IbB: ' + wellsData.ibb.total + ', IbC: ' + wellsData.ibc.total + ')\n';
            wellsDetailSection += 'Total Flowing Wells: ' + totalFlowing + ' wells (' + ((totalFlowing/totalWells)*100).toFixed(1) + '% of total)\n\n';
            wellsDetailSection += 'Individual Platform Wells:\n';
            wellsDetailSection += '• IbA Platform: ' + ibaFlowing + '/' + wellsData.iba.total + ' wells flowing (' + ((ibaFlowing/wellsData.iba.total)*100).toFixed(1) + '%)\n';
            wellsDetailSection += '• IbB Platform: ' + ibbFlowing + '/' + wellsData.ibb.total + ' wells flowing (' + ((ibbFlowing/wellsData.ibb.total)*100).toFixed(1) + '%)\n';
            wellsDetailSection += '• IbC Platform: ' + ibcFlowing + '/' + wellsData.ibc.total + ' wells flowing (' + ((ibcFlowing/wellsData.ibc.total)*100).toFixed(1) + '%)\n';
            wellsDetailSection += '• Injection Wells: ' + (document.getElementById('injectionWells').value || '0') + ' wells\n\n';

            var medicalSection = '';
            if (document.getElementById('hasMedicalUpdate').checked) {
                var name = document.getElementById('medicalPersonnelName').value;
                var company = document.getElementById('medicalCompany').value;
                var companyOther = document.getElementById('medicalCompanyOther').value;
                var condition = document.getElementById('medicalCondition').value;
                var workRelated = document.getElementById('medicalWorkRelated').value;
                var details = document.getElementById('medicalUpdateDetails').value;
                var finalCompany = company === 'Others' ? companyOther : company;
                if (name && condition) {
                    medicalSection = '\nMedical Update:\n';
                    medicalSection += 'Personnel: ' + name + (finalCompany ? ' (' + finalCompany + ')' : '') + '\n';
                    medicalSection += 'Condition: ' + condition + '\n';
                    if (workRelated) medicalSection += 'Work Related: ' + workRelated + '\n';
                    if (details) medicalSection += 'Details: ' + details + '\n';
                }
            }

            var eventsSection = '';
            if (document.getElementById('hasSignificantEvents').checked) {
                var eventType = document.getElementById('eventType').value;
                var eventTypeOther = document.getElementById('eventTypeOther').value;
                var eventTime = document.getElementById('eventDateTime').value;
                var eventsDetails = document.getElementById('significantEventsDetails').value;
                var finalEventType = eventType === 'Others' ? eventTypeOther : eventType;
                if (finalEventType && eventsDetails) {
                    eventsSection = '\nSignificant SHE Events:\n';
                    eventsSection += 'Type: ' + finalEventType + '\n';
                    if (eventTime) {
                        var eventDate = new Date(eventTime);
                        eventsSection += 'Time: ' + eventDate.toLocaleString('en-GB') + '\n';
                    }
                    eventsSection += 'Details: ' + eventsDetails + '\n';
                }
            }

            var dailyActivitiesSection = generateDailyActivitiesSection();
            var performanceDeckSection = generatePerformanceDeckSection();

            return 'COMPREHENSIVE DAILY OPERATIONS REPORT\n' +
                platformName + ' (' + platform + ')\n' +
                fDate + '\n\n' +
                'GENERATED: ' + new Date().toLocaleString('en-GB') + '\n' +
                'REPORT TYPE: Full Daily Report\n' +
                'RECIPIENT: ' + document.getElementById('recipient').value + '\n\n' +
                '==================================================\n' +
                'PERSONNEL ON BOARD (POB)\n' +
                '==================================================\n' +
                'PCSB Staff (include CDH): ' + pcsbStaff + ' personnel\n' +
                'Contractor: ' + contractorStaff + ' personnel\n' +
                'Platform POB: ' + platformPOB + ' personnel (Auto-calculated: PCSB + Contractor)\n' +
                (document.getElementById('vesselPresent').checked ? 'Vessel Present: ' + document.getElementById('vesselName').value + ' (' + document.getElementById('vesselPOB').value + ' personnel)\n' : 'No vessel present\n') +
                'Total POB: ' + document.getElementById('totalPOB').value + ' personnel (Platform + Vessel)\n\n' +
                '==================================================\n' +
                'WELLS & PRODUCTION STATUS\n' +
                '==================================================\n' +
                wellsDetailSection +
                '==================================================\n' +
                'WEATHER & MARINE CONDITIONS\n' +
                '==================================================\n' +
                'Weather Condition: ' + document.getElementById('weatherCondition').value + '\n' +
                'Swell Height: ' + (document.getElementById('swellHeightMin').value || '0') + '-' + (document.getElementById('swellHeightMax').value || '0') + 'm\n' +
                'Wind Speed: ' + (document.getElementById('windSpeedMin').value || '0') + '-' + (document.getElementById('windSpeedMax').value || '0') + ' knots\n\n' +
                '==================================================\n' +
                'PRODUCTION PERFORMANCE\n' +
                '==================================================\n' +
                'Crude Oil Production:\n' +
                '  Actual: ' + oilKBD + ' kbd (' + (document.getElementById('oilActual').value || '0') + ' kl/d with shrinkage factor 0.881)\n' +
                '  Target: ' + oilTargetKBD + ' kbd (' + (document.getElementById('oilTarget').value || '0') + ' kl/d with shrinkage factor 0.881)\n' +
                '  Status: ' + (parseFloat(oilKBD) >= parseFloat(oilTargetKBD) ? 'TARGET MET ✅' : 'BELOW TARGET ⚠️') + '\n\n' +
                'Gas Injection:\n' +
                '  Actual: ' + (document.getElementById('gasActual').value || '0') + ' mmscf/d\n' +
                '  Target: ' + (document.getElementById('gasTarget').value || '0') + ' mmscf/d\n' +
                '  Status: ' + (parseFloat(document.getElementById('gasActual').value || 0) >= parseFloat(document.getElementById('gasTarget').value || 0) ? 'TARGET MET ✅' : 'BELOW TARGET ⚠️') + '\n\n' +
                'Flare:\n' +
                '  Actual: ' + (document.getElementById('flareActual').value || '0') + ' mmscf/d\n' +
                '  Target: ' + (document.getElementById('flareTarget').value || '0') + ' mmscf/d\n' +
                '  Status: ' + (parseFloat(document.getElementById('flareActual').value || 0) <= parseFloat(document.getElementById('flareTarget').value || 0) ? 'WITHIN LIMIT ✅' : 'EXCEEDED ⚠️') + '\n\n' +
                'Watercut: ' + (document.getElementById('watercut').value || '0') + '% ' + (parseFloat(document.getElementById('watercut').value || 0) < 7 ? '(Optimal)' : parseFloat(document.getElementById('watercut').value || 0) < 10 ? '(Monitoring Required)' : '(Action Required)') + '\n\n' +
                'Platform Operating Hours:\n' +
                '• IbA: ' + (document.getElementById('ibaHours').value || '24') + ' hours\n' +
                '• IbB: ' + (document.getElementById('ibbHours').value || '24') + ' hours\n' +
                '• IbC: ' + (document.getElementById('ibcHours').value || '24') + ' hours\n\n' +
                'Gas Lift Status: ' + (document.getElementById('gasLiftStatus').value || 'Operational') + '\n\n' +
                '==================================================\n' +
                'SAFETY, HEALTH & ENVIRONMENT\n' +
                '==================================================\n' +
                document.getElementById('sheSection').value + '\n\n' +
                'Safety Statistics:\n' +
                '• Near Miss: ' + (document.getElementById('nearMiss').value || '0') + '\n' +
                '• Incidents: ' + (document.getElementById('incidents').value || '0') + '\n' +
                '• UAUC Reported: ' + (document.getElementById('uaucReported').value || '0') + '\n' +
                medicalSection + eventsSection + '\n' +
                '==================================================\n' +
                'DAILY ACTIVITIES BY WORK GROUP\n' +
                '==================================================\n' +
                dailyActivitiesSection + '\n\n' +
                '==================================================\n' +
                'PERFORMANCE DECK (KPI & PROJECTS)\n' +
                '==================================================\n' +
                performanceDeckSection + '\n\n' +
                '==================================================\n' +
                'OPERATIONS SUMMARY\n' +
                '==================================================\n' +
                'Operations Highlight:\n' +
                document.getElementById('operationsHighlight').value + '\n\n' +
                'Key Challenge:\n' +
                document.getElementById('keyChallenge').value + '\n\n' +
                'Brief Summary:\n' +
                document.getElementById('briefSummary').value + '\n\n' +
                '==================================================\n' +
                'END OF REPORT\n' +
                '==================================================';
        }

        function generateWhatsAppReport() {
            var generateBtn = document.querySelector('[onclick="generateWhatsAppReport()"]');
            var originalText = generateBtn.innerHTML;
            generateBtn.innerHTML = '🔄 Generating...';
            generateBtn.disabled = true;
            setTimeout(function() {
                var whatsappReport = generateWhatsAppContent();
                document.getElementById('whatsappSummary').value = whatsappReport;
                generateBtn.innerHTML = originalText;
                generateBtn.disabled = false;
                showAlert('✅ WhatsApp report generated!', 'success');
            }, 800);
        }

        function generateFullReport() {
            var generateBtn = document.querySelector('[onclick="generateFullReport()"]');
            var originalText = generateBtn.innerHTML;
            generateBtn.innerHTML = '🔄 Generating & Saving...';
            generateBtn.disabled = true;
            setTimeout(function() {
                var fullReport = generateFullReportContent();
                document.getElementById('fullReportPreview').value = fullReport;
                var date = document.getElementById('operationDate').value;
                var platform = document.getElementById('platform').value;
                var pob = document.getElementById('platformPOB').value || '0';
                var platformName = platform === 'IbA' ? 'Irong Barat A' : platform === 'IbB' ? 'Irong Barat B' : 'Irong Barat C';
                saveToHistory('Full Daily Report', fullReport, { platform: platformName, date: date, pob: pob }, 'full');
                generateBtn.innerHTML = originalText;
                generateBtn.disabled = false;
                showAlert('✅ Full report generated and saved to history!', 'success');
            }, 1000);
        }

        function copyToClipboard() {
            var textarea = document.getElementById('whatsappSummary');
            textarea.select();
            document.execCommand('copy');
            var copyBtn = document.querySelector('[onclick="copyToClipboard()"]');
            var originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '✅ Copied!';
            setTimeout(function() { copyBtn.innerHTML = originalText; }, 2000);
            showAlert('📋 Summary copied to clipboard!', 'success');
        }

        function copyFullReport() {
            var textarea = document.getElementById('fullReportPreview');
            textarea.select();
            document.execCommand('copy');
            var copyBtn = document.querySelector('[onclick="copyFullReport()"]');
            var originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '✅ Copied!';
            setTimeout(function() { copyBtn.innerHTML = originalText; }, 2000);
            showAlert('📋 Full report copied to clipboard!', 'success');
        }

        // AI REPORT HELPER
        var selectedAIFunction = null;
        var currentReportData = '';
        var aiFunctions = {
            refine: { title: "📝 Refine Report", desc: "Professional, confident OIM tone suitable for sharing with boss or senior stakeholders", template: "Please refine my offshore daily report so that it sounds professional, human, and written in the voice of an experienced Offshore Installation Manager (OIM). The tone must show full control of the operation, clear communication, and be suitable for sharing with my boss or senior stakeholders. Make it concise, assertive, and structured. Avoid robotic or overly formal tone – just confident and natural. Maintain the format as I want to send it via whatsapp" },
            summary: { title: "📄 Summary Paragraph", desc: "Merge all sections into one concise summary paragraph (Max 90 words)", template: "Based on the daily input for SHE, Weather, Production, Key Operations, and Challenges, write one concise summary paragraph under 75 words. Make it clear, professional, and sound like a confident OIM who understands the whole platform. No bullet points, just one flowing, structured paragraph that connects the dots." },
            challenges: { title: "⚠️ 3 Key Challenges", desc: "Create 3 short challenge statements with structured format points", template: "Based on today's condition, create 3 short challenge statements. Each must be under 25 words, sound like real offshore issues, and show I'm aware and managing the situation. Keep it professional and confident." }
        };

        function showAIReportHelperFromButton() {
            var reportData = document.getElementById('whatsappSummary').value;
            if (!reportData.trim()) {
                showAlert('Please generate WhatsApp report first', 'warning');
                return;
            }
            showAIReportHelper(reportData);
        }

        function showAIReportHelper(reportData) {
            currentReportData = reportData;
            selectedAIFunction = null;
            var buttons = document.querySelectorAll('.ai-function-btn');
            for (var i = 0; i < buttons.length; i++) buttons[i].classList.remove('active');
            document.getElementById('aiSelectedFunction').style.display = 'none';
            document.getElementById('aiReportResult').style.display = 'none';
            document.getElementById('aiReportHelperModal').classList.add('show');
        }

        function selectAIFunction(functionKey) {
            selectedAIFunction = functionKey;
            var selectedFunction = aiFunctions[functionKey];
            var buttons = document.querySelectorAll('.ai-function-btn');
            for (var i = 0; i < buttons.length; i++) buttons[i].classList.remove('active');
            document.getElementById('ai-btn-' + functionKey).classList.add('active');
            document.getElementById('aiFunctionTitle').textContent = selectedFunction.title;
            document.getElementById('aiFunctionDesc').textContent = selectedFunction.desc;
            document.getElementById('aiReportData').value = currentReportData;
            document.getElementById('aiSelectedFunction').style.display = 'block';
            document.getElementById('aiReportResult').style.display = 'none';
        }

        function generateAIReportPrompt() {
            if (!selectedAIFunction) {
                alert('Please select an AI function first.');
                return;
            }
            var reportData = document.getElementById('aiReportData').value.trim();
            if (!reportData) {
                alert('Please enter your report data.');
                return;
            }
            var selectedFunction = aiFunctions[selectedAIFunction];
            var fullPrompt = selectedFunction.template + '\n\nHere\'s my report data:\n\n' + reportData;
            document.getElementById('aiReportPromptText').textContent = fullPrompt;
            document.getElementById('aiReportResult').style.display = 'block';
        }

        function copyAIReportPrompt() {
            var text = document.getElementById('aiReportPromptText').textContent;
            navigator.clipboard.writeText(text).then(function() {
                var btn = document.querySelector('#aiReportHelperModal .ai-copy-btn');
                var originalText = btn.textContent;
                btn.textContent = '✅ Copied!';
                btn.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                setTimeout(function() {
                    btn.textContent = originalText;
                    btn.style.background = '';
                }, 2000);
            });
        }

        function closeAIReportHelper() {
            document.getElementById('aiReportHelperModal').classList.remove('show');
        }

        // HISTORY FUNCTIONS
        function saveToHistory(type, content, metadata, reportType) {
            reportType = reportType || 'whatsapp';
            var historyItem = { 
                id: Date.now(), 
                type: type, 
                content: content, 
                metadata: metadata, 
                timestamp: new Date().toISOString() 
            };
            if (reportType === 'whatsapp') reportHistory.unshift(historyItem);
            else fullReportHistory.unshift(historyItem);
            saveData();
        }

        function renderHistory() {
            if (currentHistoryTab === 'whatsapp') renderWhatsAppHistory();
            else renderFullHistory();
        }

        function renderWhatsAppHistory() {
            var content = document.getElementById('whatsappHistoryContent');
            if (!reportHistory.length) {
                content.innerHTML = '<div class="card"><div style="text-align:center;padding:40px"><h3 style="color:#64748b">📱 No WhatsApp Reports Yet</h3><p style="color:#94a3b8">Generate WhatsApp reports to see them here</p></div></div>';
                return;
            }
            var html = '';
            for (var i = 0; i < reportHistory.length; i++) {
                var item = reportHistory[i];
                html += '<div class="history-item">' +
                    '<div style="display:flex;justify-content:space-between;margin-bottom:12px">' +
                        '<div>' +
                            '<div style="font-weight:600;color:#1e40af">' + item.type + '</div>' +
                            '<div style="font-size:12px;color:#64748b">' + new Date(item.timestamp).toLocaleDateString() + '</div>' +
                        '</div>' +
                        '<button class="btn btn-danger" onclick="deleteHistoryItem(' + item.id + ',\'whatsapp\')" style="padding:4px 8px;font-size:12px">🗑️</button>' +
                    '</div>' +
                    '<div class="report-box"><pre class="report-text">' + item.content + '</pre></div>' +
                    '<div style="display:flex;gap:8px">' +
                        '<button class="btn btn-secondary" onclick="copyReportContent(' + item.id + ', \'whatsapp\')">📋 Copy</button>' +
                        '<button class="btn btn-success" onclick="downloadReportFromHistory(' + item.id + ', \'whatsapp\')">💾 Download</button>' +
                    '</div>' +
                '</div>';
            }
            content.innerHTML = html;
        }

        function renderFullHistory() {
            var content = document.getElementById('fullHistoryContent');
            if (!fullReportHistory.length) {
                content.innerHTML = '<div class="card"><div style="text-align:center;padding:40px"><h3 style="color:#64748b">📋 No Full Reports Yet</h3><p style="color:#94a3b8">Generate full reports to see them here</p></div></div>';
                return;
            }
            var html = '';
            for (var i = 0; i < fullReportHistory.length; i++) {
                var item = fullReportHistory[i];
                var preview = '';
                if (item.metadata) preview = 'Platform: ' + item.metadata.platform + ' | Date: ' + item.metadata.date + ' | POB: ' + item.metadata.pob;
                html += '<div class="history-item">' +
                    '<div style="display:flex;justify-content:space-between;margin-bottom:12px">' +
                        '<div>' +
                            '<div style="font-weight:600;color:#1e40af">' + item.type + '</div>' +
                            '<div style="font-size:12px;color:#64748b">' + new Date(item.timestamp).toLocaleDateString() + '</div>' +
                            '<div style="font-size:11px;color:#94a3b8">' + preview + '</div>' +
                        '</div>' +
                        '<button class="btn btn-danger" onclick="deleteHistoryItem(' + item.id + ',\'full\')" style="padding:4px 8px;font-size:12px">🗑️</button>' +
                    '</div>' +
                    '<div style="display:flex;gap:8px">' +
                        '<button class="btn btn-secondary" onclick="viewFullReport(' + item.id + ')">👁️ View Full Report</button>' +
                        '<button class="btn btn-success" onclick="downloadReportFromHistory(' + item.id + ', \'full\')">💾 Download</button>' +
                    '</div>' +
                '</div>';
            }
            content.innerHTML = html;
        }

        function copyReportContent(id, type) {
            var history = type === 'whatsapp' ? reportHistory : fullReportHistory;
            var item = history.find(function(item) { return item.id === id; });
            if (item) {
                navigator.clipboard.writeText(item.content).then(function() {
                    showAlert('Copied to clipboard', 'success');
                }).catch(function() {
                    showAlert('Copy failed', 'warning');
                });
            }
        }

        function downloadReportFromHistory(id, type) {
            var history = type === 'whatsapp' ? reportHistory : fullReportHistory;
            var item = history.find(function(item) { return item.id === id; });
            if (item) {
                var date = item.metadata && item.metadata.date ? item.metadata.date : new Date(item.timestamp).toISOString().split('T')[0];
                var platform = item.metadata && item.metadata.platform ? item.metadata.platform : 'Platform';
                var filename = platform + '_' + type + '_Report_' + date + '.txt';
                downloadReport(type, item.content, filename);
            }
        }

        function viewFullReport(id) {
            var report = fullReportHistory.find(function(item) { return item.id === id; });
            if (!report) return;
            var previewWindow = window.open('', '_blank', 'width=1000,height=700,scrollbars=yes');
            previewWindow.document.write(
                '<html><head><title>Full Operations Report</title>' +
                '<style>body{font-family:monospace;padding:20px;background:#f8f9fa;margin:0}' +
                '.header{background:#1e40af;color:white;padding:15px;margin:-20px -20px 20px -20px;text-align:center}' +
                'pre{background:white;padding:20px;border-radius:8px;overflow:auto;white-space:pre-wrap;line-height:1.4;font-size:13px}' +
                '.print-btn{position:fixed;top:10px;right:10px;background:#1e40af;color:white;border:none;padding:10px 20px;border-radius:5px;cursor:pointer}' +
                '.print-btn:hover{background:#1d4ed8}' +
                '</style></head><body>' +
                '<button class="print-btn" onclick="window.print()">🖨️ Print</button>' +
                '<div class="header"><h2>📋 Complete Daily Operations Report</h2></div>' +
                '<pre>' + report.content + '</pre></body></html>'
            );
        }

        function deleteHistoryItem(id, type) {
            type = type || 'whatsapp';
            if (confirm('Delete this report?')) {
                if (type === 'whatsapp') reportHistory = reportHistory.filter(function(item) { return item.id !== id; });
                else fullReportHistory = fullReportHistory.filter(function(item) { return item.id !== id; });
                saveData();
                renderHistory();
                showAlert('Report deleted', 'info');
            }
        }

        function downloadReport(type, content, filename) {
            var text = content || document.getElementById('whatsappSummary').value;
            var name;
            if (filename) {
                name = filename.replace(/\.(json|txt)$/i, '') + '.txt';
            } else {
                var today = document.getElementById('operationDate').value || new Date().toISOString().split('T')[0];
                var platform = document.getElementById('platform') ? document.getElementById('platform').value : 'Platform';
                name = platform + '_Daily_Report_' + today + '.txt';
            }
            var blob = new Blob([text], { type: 'text/plain' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = name;
            a.click();
            URL.revokeObjectURL(url);
            showAlert('Report downloaded: ' + name, 'success');
        }

        // DATA MANAGEMENT
        function saveData() {
            try {
                var data = {
                    version: '5.1_hitch_planning',
                    lastUpdated: new Date().toISOString(),
                    hitchSettings: { startDate: hitchStartDate, cycleDays: 28 },
                    wellsData: wellsData,
                    reportHistory: reportHistory,
                    fullReportHistory: fullReportHistory,
                    performanceDeck: performanceDeck,
                    dailyActivities: dailyActivities,
                    hitchObjectives: hitchObjectives,
                    focusAreas: focusAreas,
                    vvEntries: vvEntries,
                    availableWorkGroups: availableWorkGroups,
                    currentFormData: collectFormData()
                };
                localStorage.setItem('oimAssistantData', JSON.stringify(data));
                document.getElementById('lastUpdateTime').textContent = new Date().toLocaleString();
            } catch (error) {
                showAlert('Error saving data', 'warning');
            }
        }

        function loadData() {
            try {
                var saved = localStorage.getItem('oimAssistantData');
                if (saved) {
                    var data = JSON.parse(saved);
                    if (data.workActivities && !data.performanceDeck) {
                        console.log('📦 Migrating old data format: workActivities → performanceDeck');
                        data.performanceDeck = data.workActivities;
                        showAlert('📦 Data auto-migrated: workActivities → Performance Deck', 'info');
                    }
                    reportHistory = data.reportHistory || [];
                    fullReportHistory = data.fullReportHistory || [];
                    performanceDeck = data.performanceDeck || data.workActivities || [];
                    dailyActivities = data.dailyActivities || [];
                    hitchObjectives = data.hitchObjectives || [];
                    focusAreas = data.focusAreas || [];
                    vvEntries = data.vvEntries || [];
                    availableWorkGroups = data.availableWorkGroups || ['Operations', 'Maintenance', 'HMM Construction', 'HMM Painting', 'QC Team', 'Others'];
                    if (data.wellsData) {
                        wellsData = data.wellsData;
                        document.getElementById('ibaTotalWells').value = wellsData.iba.total;
                        document.getElementById('ibbTotalWells').value = wellsData.ibb.total;
                        document.getElementById('ibcTotalWells').value = wellsData.ibc.total;
                        document.getElementById('ibaMaxDisplay').textContent = wellsData.iba.total;
                        document.getElementById('ibbMaxDisplay').textContent = wellsData.ibb.total;
                        document.getElementById('ibcMaxDisplay').textContent = wellsData.ibc.total;
                        document.getElementById('ibaFlowingWells').setAttribute('max', wellsData.iba.total);
                        document.getElementById('ibbFlowingWells').setAttribute('max', wellsData.ibb.total);
                        document.getElementById('ibcFlowingWells').setAttribute('max', wellsData.ibc.total);
                    }
                    if (data.currentFormData) restoreFormData(data.currentFormData);
                    document.getElementById('ibaFlowingWells').value = wellsData.iba.flowing;
                    document.getElementById('ibbFlowingWells').value = wellsData.ibb.flowing;
                    document.getElementById('ibcFlowingWells').value = wellsData.ibc.flowing;
                    updateTotalFlowingWells();
                    document.getElementById('lastUpdateTime').textContent = 
                        data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'Never';
                }
            } catch (error) {
                showAlert('Error loading data', 'warning');
            }
        }

        function collectFormData() {
            return {
                operationDate: document.getElementById('operationDate').value,
                platform: document.getElementById('platform').value,
                recipient: document.getElementById('recipient').value,
                platformPOB: document.getElementById('platformPOB').value,
                totalPOB: document.getElementById('totalPOB').value,
                pcsbStaff: document.getElementById('pcsbStaff').value,
                contractorStaff: document.getElementById('contractorStaff').value,
                vesselPresent: document.getElementById('vesselPresent').checked,
                vesselName: document.getElementById('vesselName').value,
                vesselPOB: document.getElementById('vesselPOB').value,
                tomorrowCCB: document.getElementById('tomorrowCCB').checked,
                incomingCrew: document.getElementById('incomingCrew').value,
                outgoingCrew: document.getElementById('outgoingCrew').value,
                tomorrowPOB: document.getElementById('tomorrowPOB').value,
                weatherCondition: document.getElementById('weatherCondition').value,
                swellHeightMin: document.getElementById('swellHeightMin').value,
                swellHeightMax: document.getElementById('swellHeightMax').value,
                windSpeedMin: document.getElementById('windSpeedMin').value,
                windSpeedMax: document.getElementById('windSpeedMax').value,
                boatLocation: document.getElementById('boatLocation').value,
                boatName: document.getElementById('boatName').value,
                boatETA: document.getElementById('boatETA').value,
                sectorBoatPlan: document.getElementById('sectorBoatPlan').value,
                sectorBoatName: document.getElementById('sectorBoatName').value,
                sectorBoatETA: document.getElementById('sectorBoatETA').value,
                oilActual: document.getElementById('oilActual').value,
                oilTarget: document.getElementById('oilTarget').value,
                gasActual: document.getElementById('gasActual').value,
                gasTarget: document.getElementById('gasTarget').value,
                flareActual: document.getElementById('flareActual').value,
                flareTarget: document.getElementById('flareTarget').value,
                watercut: document.getElementById('watercut').value,
                ibaHours: document.getElementById('ibaHours').value,
                ibbHours: document.getElementById('ibbHours').value,
                ibcHours: document.getElementById('ibcHours').value,
                ibaReason: document.getElementById('ibaReason').value,
                ibbReason: document.getElementById('ibbReason').value,
                ibcReason: document.getElementById('ibcReason').value,
                ibaTotalWells: document.getElementById('ibaTotalWells').value,
                ibbTotalWells: document.getElementById('ibbTotalWells').value,
                ibcTotalWells: document.getElementById('ibcTotalWells').value,
                ibaFlowingWells: wellsData.iba.flowing,
                ibbFlowingWells: wellsData.ibb.flowing,
                ibcFlowingWells: wellsData.ibc.flowing,
                injectionWells: document.getElementById('injectionWells').value,
                gasLiftStatus: document.getElementById('gasLiftStatus').value,
                sheSection: document.getElementById('sheSection').value,
                nearMiss: document.getElementById('nearMiss').value,
                incidents: document.getElementById('incidents').value,
                uaucReported: document.getElementById('uaucReported').value,
                hasMedicalUpdate: document.getElementById('hasMedicalUpdate').checked,
                medicalPersonnelName: document.getElementById('medicalPersonnelName').value,
                medicalCompany: document.getElementById('medicalCompany').value,
                medicalCompanyOther: document.getElementById('medicalCompanyOther').value,
                medicalCondition: document.getElementById('medicalCondition').value,
                medicalWorkRelated: document.getElementById('medicalWorkRelated').value,
                medicalUpdateDetails: document.getElementById('medicalUpdateDetails').value,
                hasSignificantEvents: document.getElementById('hasSignificantEvents').checked,
                eventType: document.getElementById('eventType').value,
                eventTypeOther: document.getElementById('eventTypeOther').value,
                eventDateTime: document.getElementById('eventDateTime').value,
                significantEventsDetails: document.getElementById('significantEventsDetails').value,
                operationsHighlight: document.getElementById('operationsHighlight').value,
                keyChallenge: document.getElementById('keyChallenge').value,
                briefSummary: document.getElementById('briefSummary').value,
                productionLossDetails: document.getElementById('productionLossDetails').value,
                gasLossDetails: document.getElementById('gasLossDetails').value,
                flareExceedDetails: document.getElementById('flareExceedDetails').value,
                watercutExceedDetails: document.getElementById('watercutExceedDetails').value
            };
        }

        function restoreFormData(data) {
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    var element = document.getElementById(key);
                    if (element) {
                        if (element.type === 'checkbox') {
                            element.checked = data[key];
                        } else {
                            element.value = data[key];
                        }
                    }
                }
            }
            if (data.ibaFlowingWells !== undefined) wellsData.iba.flowing = data.ibaFlowingWells;
            if (data.ibbFlowingWells !== undefined) wellsData.ibb.flowing = data.ibbFlowingWells;
            if (data.ibcFlowingWells !== undefined) wellsData.ibc.flowing = data.ibcFlowingWells;
            if (data.ibaTotalWells !== undefined) {
                var totalWells = parseInt(data.ibaTotalWells) || 17;
                wellsData.iba.total = totalWells;
                document.getElementById('ibaTotalWells').value = totalWells;
                document.getElementById('ibaMaxDisplay').textContent = totalWells;
                document.getElementById('ibaFlowingWells').setAttribute('max', totalWells);
            }
            if (data.ibbTotalWells !== undefined) {
                var totalWells = parseInt(data.ibbTotalWells) || 5;
                wellsData.ibb.total = totalWells;
                document.getElementById('ibbTotalWells').value = totalWells;
                document.getElementById('ibbMaxDisplay').textContent = totalWells;
                document.getElementById('ibbFlowingWells').setAttribute('max', totalWells);
            }
            if (data.ibcTotalWells !== undefined) {
                var totalWells = parseInt(data.ibcTotalWells) || 6;
                wellsData.ibc.total = totalWells;
                document.getElementById('ibcTotalWells').value = totalWells;
                document.getElementById('ibcMaxDisplay').textContent = totalWells;
                document.getElementById('ibcFlowingWells').setAttribute('max', totalWells);
            }
            if (data.ibaFlowingWells !== undefined) {
                document.getElementById('ibaFlowingWells').value = data.ibaFlowingWells;
            }
            if (data.ibbFlowingWells !== undefined) {
                document.getElementById('ibbFlowingWells').value = data.ibbFlowingWells;
            }
            if (data.ibcFlowingWells !== undefined) {
                document.getElementById('ibcFlowingWells').value = data.ibcFlowingWells;
            }
            updatePOB();
            updateHitchInfo();
            updateHeaderInfo();
            updateTotalFlowingWells();
            updateProductionComments();
            updateOilConversion();
            updateSwellComment();
            updateWindComment();
            updateBoatComments();
            updateWatercutColor();
            checkHitchCycle();
            if (data.vesselPresent) {
                document.getElementById('vesselSection').classList.add('active');
            }
            if (data.tomorrowCCB) {
                document.getElementById('ccbSection').classList.add('active');
            }
            if (data.hasMedicalUpdate) {
                document.getElementById('medicalUpdateSection').classList.add('active');
                if (data.medicalCompany === 'Others') {
                    document.getElementById('medicalCompanyOther').classList.remove('hidden');
                }
            }
            if (data.hasSignificantEvents) {
                document.getElementById('significantEventsSection').classList.add('active');
                if (data.eventType === 'Others') {
                    document.getElementById('eventTypeOther').classList.remove('hidden');
                }
            }
            if (data.boatLocation) {
                toggleBoatInputs();
            }
            if (data.sectorBoatPlan === 'Plan') {
                toggleSectorBoatInputs();
            }
            validateOperatingHours('iba');
            validateOperatingHours('ibb');
            validateOperatingHours('ibc');
        }

        function saveCompleteData() {
            saveData();
            showAlert('💾 All data saved successfully!', 'success');
        }

        function exportData() {
            try {
                var today = new Date().toISOString().split('T')[0];
                var data = {
                    exportInfo: {
                        exportDate: today,
                        exportTime: new Date().toTimeString().split(' ')[0],
                        version: '5.1_hitch_planning'
                    },
                    dailyData: {},
                    wellsData: wellsData,
                    reportHistory: reportHistory,
                    fullReportHistory: fullReportHistory,
                    performanceDeck: performanceDeck,
                    dailyActivities: dailyActivities,
                    hitchObjectives: hitchObjectives,
                    focusAreas: focusAreas,
                    vvEntries: vvEntries,
                    availableWorkGroups: availableWorkGroups,
                    hitchSettings: {
                        startDate: hitchStartDate,
                        cycleDays: 28
                    },
                    settings: {
                        defaultPlatform: document.getElementById('platform').value,
                        defaultRecipient: document.getElementById('recipient').value
                    }
                };
                data.dailyData[today] = collectFormData();
                var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = 'OIM_Assist_Report_' + today + '.json';
                a.click();
                URL.revokeObjectURL(url);
                showAlert('📤 Data exported: OIM_Assist_Report_' + today + '.json', 'success');
            } catch (error) {
                showAlert('⚠ Export failed: ' + error.message, 'error');
            }
        }

        function importData(event) {
            var file = event.target.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function(e) {
                try {
                    var data = JSON.parse(e.target.result);
                    if (data.workActivities && !data.performanceDeck) {
                        console.log('📦 Migrating imported data: workActivities → performanceDeck');
                        data.performanceDeck = data.workActivities;
                        showAlert('📦 Imported data auto-migrated to new format', 'info');
                    }
                    var mergeData = confirm('Merge with existing data? (Cancel = Replace all)');
                    if (mergeData) {
                        reportHistory = reportHistory.concat(data.reportHistory || []);
                        fullReportHistory = fullReportHistory.concat(data.fullReportHistory || []);
                        performanceDeck = performanceDeck.concat(data.performanceDeck || data.workActivities || []);
                        dailyActivities = dailyActivities.concat(data.dailyActivities || []);
                        hitchObjectives = hitchObjectives.concat(data.hitchObjectives || []);
                        focusAreas = focusAreas.concat(data.focusAreas || []);
                        vvEntries = vvEntries.concat(data.vvEntries || []);
                        if (data.availableWorkGroups) {
                            for (var i = 0; i < data.availableWorkGroups.length; i++) {
                                if (availableWorkGroups.indexOf(data.availableWorkGroups[i]) === -1) {
                                    availableWorkGroups.push(data.availableWorkGroups[i]);
                                }
                            }
                        }
                    } else {
                        reportHistory = data.reportHistory || [];
                        fullReportHistory = data.fullReportHistory || [];
                        performanceDeck = data.performanceDeck || data.workActivities || [];
                        dailyActivities = data.dailyActivities || [];
                        hitchObjectives = data.hitchObjectives || [];
                        focusAreas = data.focusAreas || [];
                        vvEntries = data.vvEntries || [];
                        availableWorkGroups = data.availableWorkGroups || availableWorkGroups;
                    }
                    if (data.wellsData) {
                        wellsData = data.wellsData;
                    }
                    if (data.dailyData) {
                        var dates = Object.keys(data.dailyData);
                        if (dates.length > 0) {
                            var latestDate = dates.sort().pop();
                            restoreFormData(data.dailyData[latestDate]);
                        }
                    } else if (data.currentFormData) {
                        restoreFormData(data.currentFormData);
                    }
                    saveData();
                    renderHistory();
                    renderPerformanceDeck();
                    renderVVEntries();
                    renderHitchObjectives();
                    renderFocusAreas();
                    loadDailyActivitiesForDate();
                    updatePerformanceGroupFilter();
                    updateTotalFlowingWells();
                    checkHitchCycle();
                    var importCount = (data.reportHistory ? data.reportHistory.length : 0) + 
                                    (data.fullReportHistory ? data.fullReportHistory.length : 0) + 
                                    (data.performanceDeck ? data.performanceDeck.length : 0) +
                                    (data.workActivities ? data.workActivities.length : 0) +
                                    (data.dailyActivities ? data.dailyActivities.length : 0) +
                                    (data.hitchObjectives ? data.hitchObjectives.length : 0) +
                                    (data.focusAreas ? data.focusAreas.length : 0) +
                                    (data.vvEntries ? data.vvEntries.length : 0);
                    showAlert('✅ Successfully imported ' + importCount + ' items!', 'success');
                } catch (error) {
                    showAlert('⚠ Invalid file format: ' + error.message, 'error');
                }
            };
            reader.readAsText(file);
            event.target.value = '';
        }

        function resetAll() {
            if (confirm('Reset all data? This will clear all reports, performance items, daily activities, hitch planning, wells data, and settings.')) {
                reportHistory = [];
                fullReportHistory = [];
                performanceDeck = [];
                dailyActivities = [];
                hitchObjectives = [];
                focusAreas = [];
                vvEntries = [];
                availableWorkGroups = ['Operations', 'Maintenance', 'HMM Construction', 'HMM Painting', 'QC Team', 'Others'];
                selectedStatusFilters = [];
                wellsData = {
                    iba: { total: 17, flowing: 0 },
                    ibb: { total: 5, flowing: 0 },
                    ibc: { total: 6, flowing: 0 }
                };
                localStorage.removeItem('oimAssistantData');
                var elements = document.querySelectorAll('input,textarea,select');
                for (var i = 0; i < elements.length; i++) {
                    var el = elements[i];
                    if (el.type === 'checkbox') {
                        el.checked = false;
                    } else if (el.type === 'date') {
                        el.value = new Date().toISOString().split('T')[0];
                    } else if (el.id === 'recipient') {
                        el.value = 'En. Azri & All';
                    } else if (el.id === 'platform') {
                        el.value = 'IbA';
                    } else if (el.id === 'ibaHours' || el.id === 'ibbHours' || el.id === 'ibcHours') {
                        el.value = '24';
                    } else if (el.id === 'nearMiss' || el.id === 'incidents' || el.id === 'uaucReported') {
                        el.value = '0';
                    } else if (el.id === 'gasLiftStatus') {
                        el.value = 'Operational';
                    } else if (el.id === 'ibaFlowingWells' || el.id === 'ibbFlowingWells' || el.id === 'ibcFlowingWells') {
                        el.value = '0';
                    } else if (el.id === 'ibaTotalWells') {
                        el.value = '17';
                    } else if (el.id === 'ibbTotalWells') {
                        el.value = '5';
                    } else if (el.id === 'ibcTotalWells') {
                        el.value = '6';
                    } else if (el.id === 'sheSection' || el.id === 'operationsHighlight' || el.id === 'keyChallenge' || el.id === 'briefSummary') {
                    } else {
                        el.value = '';
                    }
                }
                document.getElementById('status-all').checked = true;
                document.getElementById('statusFilterDisplay').innerHTML = 'All Status';
                document.getElementById('vesselSection').classList.remove('active');
                document.getElementById('ccbSection').classList.remove('active');
                document.getElementById('medicalUpdateSection').classList.remove('active');
                document.getElementById('significantEventsSection').classList.remove('active');
                document.getElementById('boatInputs').classList.add('hidden');
                document.getElementById('sectorBoatInputs').classList.add('hidden');
                updateTotalFlowingWells();
                renderHistory();
                renderPerformanceDeck();
                renderVVEntries();
                renderHitchObjectives();
                renderFocusAreas();
                renderDailyActivityCards();
                updatePerformanceGroupFilter();
                updateHitchInfo();
                updateHeaderInfo();
                checkHitchCycle();
                showAlert('✅ All data reset successfully', 'info');
            }
        }

        function showAlert(message, type) {
            var alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-' + type;
            alertDiv.textContent = message;
            alertDiv.style.position = 'fixed';
            alertDiv.style.top = '20px';
            alertDiv.style.right = '20px';
            alertDiv.style.zIndex = '9999';
            alertDiv.style.minWidth = '300px';
            alertDiv.style.maxWidth = '400px';
            alertDiv.style.borderRadius = '6px';
            document.body.appendChild(alertDiv);
            setTimeout(function() {
                alertDiv.remove();
            }, 4000);
        }

        // TAB & VIEW SWITCHING
        function switchTab(tabName) {
            var tabButtons = document.querySelectorAll('.tab-btn');
            for (var i = 0; i < tabButtons.length; i++) {
                tabButtons[i].classList.remove('active');
            }
            var tabContents = document.querySelectorAll('.tab-content');
            for (var i = 0; i < tabContents.length; i++) {
                tabContents[i].classList.remove('active');
            }
            var targetTab = document.getElementById('tab-' + tabName);
            if (targetTab) {
                targetTab.classList.add('active');
            }
            var targetButton = document.getElementById('tab-btn-' + tabName);
            if (targetButton) {
                targetButton.classList.add('active');
            }
            currentTab = tabName;
            if (tabName === 'daily-activity') {
                loadDailyActivitiesForDate();
            }
            if (tabName === 'hitch-planning') {
                checkHitchCycle();
                renderHitchObjectives();
                renderFocusAreas();
            }
        }

        function switchView(viewName) {
            var views = document.querySelectorAll('[id^="view-"]');
            for (var i = 0; i < views.length; i++) {
                views[i].classList.add('hidden');
            }
            var navButtons = document.querySelectorAll('.nav-button');
            for (var i = 0; i < navButtons.length; i++) {
                navButtons[i].classList.remove('active');
            }
            var targetView = document.getElementById('view-' + viewName);
            if (targetView) {
                targetView.classList.remove('hidden');
            }
            var targetNav = document.getElementById('nav-' + viewName);
            if (targetNav) {
                targetNav.classList.add('active');
            }
            currentView = viewName;
            if (viewName === 'history') {
                renderHistory();
            }
        }

        function switchHistoryTab(tabName) {
            var historyTabButtons = document.querySelectorAll('#view-history .tab-btn');
            for (var i = 0; i < historyTabButtons.length; i++) {
                historyTabButtons[i].classList.remove('active');
            }
            var historyTabContents = document.querySelectorAll('#view-history .tab-content');
            for (var i = 0; i < historyTabContents.length; i++) {
                historyTabContents[i].classList.remove('active');
            }
            var targetHistoryTab = document.getElementById('history-tab-' + tabName);
            if (targetHistoryTab) {
                targetHistoryTab.classList.add('active');
            }
            var targetHistoryButton = document.getElementById('history-tab-btn-' + tabName);
            if (targetHistoryButton) {
                targetHistoryButton.classList.add('active');
            }
            currentHistoryTab = tabName;
            renderHistory();
        }

        // TIME & DATE FUNCTIONS
        function updateTime() {
            var now = new Date();
            var timeString = now.toLocaleTimeString('en-MY', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            var dateString = now.toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
            });
            document.getElementById('currentTime').textContent = timeString;
            document.getElementById('currentDate').textContent = dateString;
        }

        function updateHeaderInfo() {
            var platform = document.getElementById('platform').value;
            var pob = document.getElementById('totalPOB').value || '--';
            var totalWells = wellsData.iba.flowing + wellsData.ibb.flowing + wellsData.ibc.flowing;
            document.getElementById('headerPlatform').textContent = platform;
            document.getElementById('headerPOB').textContent = pob;
            document.getElementById('headerTotalWells').textContent = totalWells;
        }

        function updateHitchInfo() {
            var operationDate = document.getElementById('operationDate').value;
            if (!operationDate) return;
            var selectedDate = new Date(operationDate);
            var startDate = new Date(hitchStartDate);
            var daysDiff = Math.floor((selectedDate - startDate) / (1000 * 60 * 60 * 24));
            var cyclePosition = ((daysDiff % 28) + 28) % 28;
            var hitchStatus;
            if (cyclePosition < 14) {
                var dayInHitch = cyclePosition + 1;
                var week = dayInHitch <= 7 ? 1 : 2;
                var dayInWeek = dayInHitch <= 7 ? dayInHitch : dayInHitch - 7;
                hitchStatus = 'Week ' + week + ' On - Day ' + dayInWeek + ' (' + (14 - cyclePosition) + ' days to demob)';
            } else {
                var dayOff = cyclePosition - 13;
                hitchStatus = 'Off Duty - Day ' + dayOff + ' (' + (28 - cyclePosition) + ' days to mob)';
            }
            document.getElementById('hitchInfo').textContent = hitchStatus;
        }

        // INITIALIZATION
        function init() {
            var today = new Date().toISOString().split('T')[0];
            document.getElementById('operationDate').value = today;
            updateHitchInfo();
            updateTime();
            updateHeaderInfo();
            loadData();
            renderPerformanceDeck();
            renderVVEntries();
            renderHitchObjectives();
            renderFocusAreas();
            loadDailyActivitiesForDate();
            updatePerformanceGroupFilter();
            updateTotalFlowingWells();
            checkHitchCycle();
            document.getElementById('status-all').checked = true;
            selectedStatusFilters = [];
            setInterval(updateTime, 1000);
        }

        // MODAL CLOSE HANDLER
        window.onclick = function(event) {
            var reportHelperModal = document.getElementById('aiReportHelperModal');
            if (event.target === reportHelperModal) {
                closeAIReportHelper();
            }
        }

        // INITIALIZE APP
        window.addEventListener('load', function() {
            init();
            switchTab('basic');
        });

        // ADD REQUIRED LIBRARIES
        var script1 = document.createElement('script');
        script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        document.head.appendChild(script1);

        var script2 = document.createElement('script');
        script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js';
        document.head.appendChild(script2);
