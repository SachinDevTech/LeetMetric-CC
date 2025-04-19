document.addEventListener("DOMContentLoaded", function() {
    const searchButton = document.getElementById("search-btn");
    const usernameInput = document.getElementById("user-input");
    const statsContainer = document.querySelector(".stats-container");
    const easyProgressCircle = document.querySelector(".easy-progress");
    const mediumProgressCircle = document.querySelector(".medium-progress");
    const hardProgressCircle = document.querySelector(".hard-progress");
    const easyLabel = document.getElementById("easy-label");
    const mediumLabel = document.getElementById("medium-label");
    const hardLabel = document.getElementById("hard-label");
    const cardStatsContainer = document.querySelector(".stats-cards");

    // Validate username format
    function validateUsername(username) {
        if(username.trim() === "") {
            alert("Username should not be empty");
            return false;
        }
        const regex = /^[a-zA-Z0-9_-]{1,15}$/;
        const isMatching = regex.test(username);
        if(!isMatching) {
            alert("Invalid Username");
        }
        return isMatching;
    }

    async function fetchUserDetails(username) {
        try {
            searchButton.textContent = "Searching...";
            searchButton.disabled = true;
            
            // Use the LeetCode GraphQL API directly
            const targetUrl = 'https://leetcode.com/graphql/';
            
            const graphql = JSON.stringify({
                query: `
                    query getUserProfile($username: String!) {
                        allQuestionsCount {
                            difficulty
                            count
                        }
                        matchedUser(username: $username) {
                            username
                            submitStats: submitStatsGlobal {
                                acSubmissionNum {
                                    difficulty
                                    count
                                    submissions
                                }
                                totalSubmissionNum {
                                    difficulty
                                    count
                                    submissions
                                }
                            }
                        }
                    }
                `,
                variables: { username }
            });
            
            // Using a CORS proxy - you might need to use your own or set up a backend
            // For development, you could use https://cors-anywhere.herokuapp.com/ after requesting access
            // For production, consider setting up your own proxy or backend service
            const proxyUrl = 'https://corsproxy.io/?'; 
            
            const response = await fetch(proxyUrl + targetUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Origin": window.location.origin
                },
                body: graphql
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
            }
            
            const parsedData = await response.json();
            console.log("LeetCode response:", parsedData);
            
            if (!parsedData.data || !parsedData.data.matchedUser) {
                throw new Error("User not found or API error");
            }
            
            displayUserData(parsedData.data);
        }
        catch(error) {
            console.error("Error fetching user data:", error);
            statsContainer.innerHTML = `<p class="error-message">Error: ${error.message || "Failed to fetch user data"}</p>`;
        }
        finally {
            searchButton.textContent = "Search";
            searchButton.disabled = false;
        }
    }

    function updateProgress(solved, total, label, circle) {
        const progressDegree = total > 0 ? (solved/total)*100 : 0;
        circle.style.setProperty("--progress-degree", `${progressDegree}%`);
        label.textContent = `${solved}/${total}`;
    }

    function displayUserData(data) {
        try {
            // Make sure the container is visible
            statsContainer.classList.remove("hidden");
            
            // Extract question counts by difficulty
            const totalQues = data.allQuestionsCount.reduce((sum, item) => sum + item.count, 0);
            const totalEasyQues = data.allQuestionsCount.find(item => item.difficulty === "EASY")?.count || 0;
            const totalMediumQues = data.allQuestionsCount.find(item => item.difficulty === "MEDIUM")?.count || 0;
            const totalHardQues = data.allQuestionsCount.find(item => item.difficulty === "HARD")?.count || 0;
            
            // Extract solved questions by difficulty
            const submitStats = data.matchedUser.submitStats;
            const solvedTotalQues = submitStats.acSubmissionNum.find(item => item.difficulty === "All")?.count || 0;
            const solvedTotalEasyQues = submitStats.acSubmissionNum.find(item => item.difficulty === "Easy")?.count || 0;
            const solvedTotalMediumQues = submitStats.acSubmissionNum.find(item => item.difficulty === "Medium")?.count || 0;
            const solvedTotalHardQues = submitStats.acSubmissionNum.find(item => item.difficulty === "Hard")?.count || 0;
            
            // Update progress circles
            updateProgress(solvedTotalEasyQues, totalEasyQues, easyLabel, easyProgressCircle);
            updateProgress(solvedTotalMediumQues, totalMediumQues, mediumLabel, mediumProgressCircle);
            updateProgress(solvedTotalHardQues, totalHardQues, hardLabel, hardProgressCircle);
            
            // Prepare data for submission cards
            const cardsData = [
                {
                    label: "Overall Submissions", 
                    value: submitStats.totalSubmissionNum.find(item => item.difficulty === "All")?.submissions || 0
                },
                {
                    label: "Easy Submissions", 
                    value: submitStats.totalSubmissionNum.find(item => item.difficulty === "Easy")?.submissions || 0
                },
                {
                    label: "Medium Submissions", 
                    value: submitStats.totalSubmissionNum.find(item => item.difficulty === "Medium")?.submissions || 0
                },
                {
                    label: "Hard Submissions", 
                    value: submitStats.totalSubmissionNum.find(item => item.difficulty === "Hard")?.submissions || 0
                }
            ];
            
            // Update the stats cards
            cardStatsContainer.innerHTML = cardsData.map(data => 
                `<div class="card">
                    <h4>${data.label}</h4>
                    <p>${data.value}</p>
                </div>`
            ).join("");
        } catch (error) {
            console.error("Error displaying user data:", error);
            statsContainer.innerHTML = `<p class="error-message">Error processing data: ${error.message}</p>`;
        }
    }

    // Event listeners
    searchButton.addEventListener('click', function() {
        const username = usernameInput.value;
        console.log("Username entered:", username);
        if(validateUsername(username)) {
            fetchUserDetails(username);
        }
    });

    // Allow pressing Enter key to search
    usernameInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            searchButton.click();
        }
    });
});