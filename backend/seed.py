import asyncio
import logging
import uuid
from datetime import datetime, timezone, timedelta
import random
from app.database.mongodb import connect_to_mongo, close_mongo_connection, get_database
from app.core.security import get_password_hash
from app.core.config import settings
from app.schemas.user import UserRole
from app.schemas.task import TaskCategory, TaskDifficulty, TaskStatus
from app.schemas.reward import RewardType, RewardStatus

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed")

DEMO_USERS_DATA = [
    ("Raghav Sharma", "raghav@example.com", "9876543210", "Gold", 12450, 7),
    ("Priya Patel", "priya@example.com", "9876543211", "Platinum", 28900, 14),
    ("Amit Verma", "amit@example.com", "9876543212", "Silver", 4200, 3),
    ("Sneha Reddy", "sneha@example.com", "9876543213", "Diamond", 54300, 28),
    ("Rohan Gupta", "rohan@example.com", "9876543214", "Bronze", 850, 1),
    ("Ananya Roy", "ananya@example.com", "9876543215", "Gold", 9800, 5),
    ("Vikram Singh", "vikram@example.com", "9876543216", "Silver", 3400, 2),
    ("Deepika Nair", "deepika@example.com", "9876543217", "Platinum", 21500, 12),
    ("Karan Mehta", "karan@example.com", "9876543218", "Gold", 11200, 6),
    ("Pooja Joshi", "pooja@example.com", "9876543219", "Bronze", 600, 1),
    ("Siddharth Das", "siddharth@example.com", "9876543220", "Silver", 4950, 4),
    ("Neha Kapoor", "neha@example.com", "9876543221", "Gold", 14200, 9),
    ("Rahul Saxena", "rahul@example.com", "9876543222", "Platinum", 33400, 19),
    ("Meera Nambiar", "meera@example.com", "9876543223", "Silver", 2800, 2),
    ("Arjun Singhania", "arjun@example.com", "9876543224", "Diamond", 68900, 35),
    ("Divya Iyer", "divya@example.com", "9876543225", "Bronze", 920, 1),
    ("Harsh Vardhan", "harsh@example.com", "9876543226", "Gold", 13500, 8),
    ("Simran Kaur", "simran@example.com", "9876543227", "Silver", 3750, 3),
    ("Manish Tiwari", "manish@example.com", "9876543228", "Bronze", 450, 0),
    ("Tanvi Deshmukh", "tanvi@example.com", "9876543229", "Platinum", 25600, 15),
]

TASKS_DATA = [
    # 1. 5 GENERAL KNOWLEDGE TASKS
    {
        "title": "Answer 5 General Knowledge Questions",
        "description": "Test your general knowledge with this quick 5-question trivia challenge covering world geography and science.",
        "category": TaskCategory.KNOWLEDGE,
        "difficulty": TaskDifficulty.EASY,
        "points": 100,
        "time_limit_minutes": 2,
        "instructions": [
            "Read the question carefully.",
            "Select the correct answer from the 4 options.",
            "Earn +100 points instantly."
        ],
        "requirements": "Answer the question correctly.",
        "verification_type": "INTERACTIVE_QUIZ",
        "interactive_data": {
            "type": "QUIZ",
            "question": "Which is the largest ocean on Earth covering more than 30% of the planet's surface?",
            "options": ["Atlantic Ocean", "Indian Ocean", "Pacific Ocean", "Arctic Ocean"],
            "correct_option_index": 2,
            "hint": "It borders Asia, Australia, and the Americas."
        },
        "is_daily": False,
        "status": TaskStatus.ACTIVE
    },
    {
        "title": "Answer 10 True/False Questions",
        "description": "Speed round! Verify this fast true/false statement about Earth sciences and human biology.",
        "category": TaskCategory.KNOWLEDGE,
        "difficulty": TaskDifficulty.EASY,
        "points": 150,
        "time_limit_minutes": 3,
        "instructions": [
            "Evaluate whether the statement is factually True or False.",
            "Submit your choice to verify and earn points."
        ],
        "requirements": "Select True or False.",
        "verification_type": "TRUE_FALSE",
        "interactive_data": {
            "type": "TRUE_FALSE",
            "question": "Light travels significantly faster through air than sound does through air.",
            "options": ["True", "False"],
            "correct_option_index": 0,
            "hint": "Think about why you see lightning before hearing thunder."
        },
        "is_daily": False,
        "status": TaskStatus.ACTIVE
    },
    {
        "title": "World Capitals Quick Trivia",
        "description": "Can you identify major world capitals in under 2 minutes? Complete this quick knowledge check.",
        "category": TaskCategory.KNOWLEDGE,
        "difficulty": TaskDifficulty.EASY,
        "points": 100,
        "time_limit_minutes": 2,
        "instructions": [
            "Identify the national capital city.",
            "Submit to claim your points."
        ],
        "requirements": "Select the correct capital.",
        "verification_type": "INTERACTIVE_QUIZ",
        "interactive_data": {
            "type": "QUIZ",
            "question": "What is the capital city of Australia?",
            "options": ["Sydney", "Melbourne", "Canberra", "Brisbane"],
            "correct_option_index": 2,
            "hint": "It was purpose-built as a planned capital between Sydney and Melbourne."
        },
        "is_daily": False,
        "status": TaskStatus.ACTIVE
    },
    {
        "title": "Indian Heritage & Geography Check",
        "description": "A quick 2-minute trivia check celebrating Indian history, culture, and iconic geographical landmarks.",
        "category": TaskCategory.KNOWLEDGE,
        "difficulty": TaskDifficulty.EASY,
        "points": 125,
        "time_limit_minutes": 2,
        "instructions": [
            "Read the historical trivia question.",
            "Select the correct answer."
        ],
        "requirements": "Correct option selection.",
        "verification_type": "INTERACTIVE_QUIZ",
        "interactive_data": {
            "type": "QUIZ",
            "question": "Which Indian state is famously known as the 'Land of Five Rivers'?",
            "options": ["Punjab", "Rajasthan", "Kerala", "Uttarakhand"],
            "correct_option_index": 0,
            "hint": "The name itself translates from Persian for 'five' (panj) and 'water' (ab)."
        },
        "is_daily": False,
        "status": TaskStatus.ACTIVE
    },
    {
        "title": "Solar System & Space Explorer",
        "description": "Explore astronomical facts about planetary orbits, moons, and the solar system.",
        "category": TaskCategory.KNOWLEDGE,
        "difficulty": TaskDifficulty.EASY,
        "points": 100,
        "time_limit_minutes": 2,
        "instructions": [
            "Identify the astronomical property.",
            "Confirm to claim points."
        ],
        "requirements": "Select the correct planet.",
        "verification_type": "INTERACTIVE_QUIZ",
        "interactive_data": {
            "type": "QUIZ",
            "question": "Which planet in our solar system is known as the 'Red Planet' due to iron oxide on its surface?",
            "options": ["Venus", "Mars", "Jupiter", "Saturn"],
            "correct_option_index": 1,
            "hint": "It is the 4th planet from the Sun and target of Perseverance rover."
        },
        "is_daily": False,
        "status": TaskStatus.ACTIVE
    },

    # 2. 5 TECHNOLOGY TASKS
    {
        "title": "Answer 5 Technology Questions",
        "description": "Quick 2-minute tech challenge covering Internet protocols, software, and hardware fundamentals.",
        "category": TaskCategory.TECHNOLOGY,
        "difficulty": TaskDifficulty.EASY,
        "points": 100,
        "time_limit_minutes": 2,
        "instructions": [
            "Read the tech trivia question.",
            "Select the correct definition."
        ],
        "requirements": "Answer correctly.",
        "verification_type": "INTERACTIVE_QUIZ",
        "interactive_data": {
            "type": "QUIZ",
            "question": "What does 'HTTP' stand for in web addresses and network communications?",
            "options": [
                "HyperText Transfer Protocol",
                "High Traffic Transmission Process",
                "Hyperlink Text Translation Platform",
                "Host Terminal Tracking Protocol"
            ],
            "correct_option_index": 0,
            "hint": "It is the foundational protocol used by the World Wide Web."
        },
        "is_daily": False,
        "status": TaskStatus.ACTIVE
    },
    {
        "title": "Learn 3 New Technology Facts",
        "description": "Read this quick overview on semiconductor chips, quantum computing, and optical fiber communications.",
        "category": TaskCategory.TECHNOLOGY,
        "difficulty": TaskDifficulty.EASY,
        "points": 75,
        "time_limit_minutes": 2,
        "instructions": [
            "Read the 3 short technology facts below.",
            "Confirm your reading to earn +75 bonus points."
        ],
        "requirements": "Read the facts for at least 15 seconds.",
        "verification_type": "READING_CONFIRM",
        "interactive_data": {
            "type": "READING",
            "reading_passage": "Fact 1: Modern smartphone processors contain over 15 billion microscopic transistors fabricated at 3-nanometer scale.\n\nFact 2: Undersea fiber optic cables carry over 99% of all international transcontinental internet traffic at the speed of light in glass.\n\nFact 3: Quantum computers utilize quantum bits (qubits) that can exist in superposition states of 0 and 1 simultaneously.",
            "min_reading_seconds": 10
        },
        "is_daily": False,
        "status": TaskStatus.ACTIVE
    },
    {
        "title": "Web Security & HTTPS Basics",
        "description": "Verify your understanding of digital security, encryption, and secure HTTPS connections.",
        "category": TaskCategory.TECHNOLOGY,
        "difficulty": TaskDifficulty.EASY,
        "points": 100,
        "time_limit_minutes": 2,
        "instructions": [
            "Review the web security statement.",
            "Select True or False."
        ],
        "requirements": "Accurate true/false answer.",
        "verification_type": "TRUE_FALSE",
        "interactive_data": {
            "type": "TRUE_FALSE",
            "question": "HTTPS uses Transport Layer Security (TLS) encryption to protect sensitive data transferred between your browser and website servers.",
            "options": ["True", "False"],
            "correct_option_index": 0,
            "hint": "The 'S' in HTTPS stands for Secure."
        },
        "is_daily": False,
        "status": TaskStatus.ACTIVE
    },
    {
        "title": "Cloud Computing 101: IaaS vs PaaS",
        "description": "Understand cloud service models and identify key characteristics of Infrastructure as a Service.",
        "category": TaskCategory.TECHNOLOGY,
        "difficulty": TaskDifficulty.EASY,
        "points": 125,
        "time_limit_minutes": 2,
        "instructions": [
            "Read the cloud computing question.",
            "Select the correct service model."
        ],
        "requirements": "Select correct option.",
        "verification_type": "INTERACTIVE_QUIZ",
        "interactive_data": {
            "type": "QUIZ",
            "question": "Which cloud computing model provides raw virtual machines, storage, and networking hardware over the Internet?",
            "options": [
                "IaaS (Infrastructure as a Service)",
                "SaaS (Software as a Service)",
                "PaaS (Platform as a Service)",
                "FaaS (Function as a Service)"
            ],
            "correct_option_index": 0,
            "hint": "Examples include AWS EC2 and Google Compute Engine."
        },
        "is_daily": False,
        "status": TaskStatus.ACTIVE
    },
    {
        "title": "Understanding API Protocols (REST vs GraphQL)",
        "description": "Learn the core principles of Application Programming Interfaces and client-server architecture.",
        "category": TaskCategory.TECHNOLOGY,
        "difficulty": TaskDifficulty.EASY,
        "points": 150,
        "time_limit_minutes": 3,
        "instructions": [
            "Evaluate standard RESTful API conventions.",
            "Select the correct answer."
        ],
        "requirements": "Select the correct option.",
        "verification_type": "INTERACTIVE_QUIZ",
        "interactive_data": {
            "type": "QUIZ",
            "question": "Which HTTP method is specifically intended to retrieve or read data from a server without modifying it?",
            "options": ["GET", "POST", "DELETE", "PATCH"],
            "correct_option_index": 0,
            "hint": "It is an idempotent and safe HTTP verb."
        },
        "is_daily": False,
        "status": TaskStatus.ACTIVE
    },

    # 3. 3 DAILY CHALLENGES
    {
        "title": "Complete Today's Mini Quiz",
        "description": "Your quick daily knowledge mini-quiz. Complete today's challenge to keep your progress active!",
        "category": TaskCategory.DAILY_CHALLENGE,
        "difficulty": TaskDifficulty.EASY,
        "points": 150,
        "time_limit_minutes": 3,
        "instructions": [
            "Complete today's daily question.",
            "Earn +150 points and progress towards your 3-task daily bonus."
        ],
        "requirements": "Complete mini quiz.",
        "verification_type": "INTERACTIVE_QUIZ",
        "interactive_data": {
            "type": "QUIZ",
            "question": "What is the primary function of Random Access Memory (RAM) in a computer?",
            "options": [
                "Temporary, ultra-fast working memory for active programs",
                "Permanent long-term file storage like photos and videos",
                "Powering the cooling fans and motherboard lights",
                "Scanning incoming network packets for computer viruses"
            ],
            "correct_option_index": 0,
            "hint": "RAM is volatile memory cleared when the computer shuts down."
        },
        "is_daily": True,
        "status": TaskStatus.ACTIVE
    },
    {
        "title": "Complete the Daily Challenge",
        "description": "Today's featured daily task. Answer the prompt to earn points and maintain your daily momentum.",
        "category": TaskCategory.DAILY_CHALLENGE,
        "difficulty": TaskDifficulty.EASY,
        "points": 150,
        "time_limit_minutes": 3,
        "instructions": [
            "Check the daily challenge prompt.",
            "Submit your response to claim +150 points."
        ],
        "requirements": "Complete daily challenge.",
        "verification_type": "INTERACTIVE_QUIZ",
        "interactive_data": {
            "type": "QUIZ",
            "question": "In digital payments, what is the full form of UPI in India?",
            "options": [
                "Unified Payments Interface",
                "Universal Platform for Internet",
                "United Postal Investment",
                "Unique Personal Identification"
            ],
            "correct_option_index": 0,
            "hint": "Managed by the National Payments Corporation of India (NPCI)."
        },
        "is_daily": True,
        "status": TaskStatus.ACTIVE
    },
    {
        "title": "Complete Today's Knowledge Challenge",
        "description": "Comprehensive daily knowledge test covering world milestones and modern innovations.",
        "category": TaskCategory.DAILY_CHALLENGE,
        "difficulty": TaskDifficulty.MEDIUM,
        "points": 200,
        "time_limit_minutes": 5,
        "instructions": [
            "Answer the daily knowledge challenge question.",
            "Score +200 points."
        ],
        "requirements": "Answer correctly.",
        "verification_type": "INTERACTIVE_QUIZ",
        "interactive_data": {
            "type": "QUIZ",
            "question": "Who is universally recognized as the inventor of the World Wide Web in 1989 while working at CERN?",
            "options": ["Tim Berners-Lee", "Alan Turing", "Vint Cerf", "Linus Torvalds"],
            "correct_option_index": 0,
            "hint": "He also created the first web browser and HTML specification."
        },
        "is_daily": True,
        "status": TaskStatus.ACTIVE
    },

    # 4. 3 BRAIN CHALLENGES / QUICK TASKS
    {
        "title": "Complete the Quick Brain Challenge",
        "description": "Sharpen your analytical thinking and mental agility with this fast pattern and logic question.",
        "category": TaskCategory.QUICK_TASK,
        "difficulty": TaskDifficulty.EASY,
        "points": 125,
        "time_limit_minutes": 2,
        "instructions": [
            "Analyze the number sequence pattern.",
            "Select the next logical number."
        ],
        "requirements": "Select correct next value.",
        "verification_type": "INTERACTIVE_QUIZ",
        "interactive_data": {
            "type": "QUIZ",
            "question": "What is the next number in the sequence: 2, 4, 8, 16, 32, ___?",
            "options": ["48", "64", "54", "72"],
            "correct_option_index": 1,
            "hint": "Each term is multiplied by 2 (powers of 2)."
        },
        "is_daily": False,
        "status": TaskStatus.ACTIVE
    },
    {
        "title": "Pattern Recognition Speed Test",
        "description": "Test your visual and logical deductive skills in this 2-minute quick brain sprint.",
        "category": TaskCategory.QUICK_TASK,
        "difficulty": TaskDifficulty.EASY,
        "points": 150,
        "time_limit_minutes": 2,
        "instructions": [
            "Identify the odd one out among the listed items.",
            "Confirm to claim +150 points."
        ],
        "requirements": "Identify the odd element.",
        "verification_type": "INTERACTIVE_QUIZ",
        "interactive_data": {
            "type": "QUIZ",
            "question": "Which of the following does NOT belong to the group of standard web programming languages?",
            "options": ["JavaScript", "Python", "TypeScript", "Diesel"],
            "correct_option_index": 3,
            "hint": "Three are programming languages, one is a fuel/engine type."
        },
        "is_daily": False,
        "status": TaskStatus.ACTIVE
    },
    {
        "title": "Mental Math Sprint",
        "description": "Quick mathematical calculation to boost mental alertness and earn instant points.",
        "category": TaskCategory.QUICK_TASK,
        "difficulty": TaskDifficulty.EASY,
        "points": 100,
        "time_limit_minutes": 2,
        "instructions": [
            "Calculate the result mentally.",
            "Select the correct answer."
        ],
        "requirements": "Correct mathematical sum.",
        "verification_type": "INTERACTIVE_QUIZ",
        "interactive_data": {
            "type": "QUIZ",
            "question": "If you buy 4 items costing 25 points each and receive a 10% discount, how many points do you spend?",
            "options": ["90", "85", "95", "100"],
            "correct_option_index": 0,
            "hint": "4 × 25 = 100. 100 minus 10% (10) = 90."
        },
        "is_daily": False,
        "status": TaskStatus.ACTIVE
    },

    # 5. 2 LEARNING TASKS
    {
        "title": "Complete Your Daily Learning Activity",
        "description": "Read this 2-minute digest on effective habit building, atomic progress, and daily goal setting.",
        "category": TaskCategory.LEARNING,
        "difficulty": TaskDifficulty.EASY,
        "points": 100,
        "time_limit_minutes": 2,
        "instructions": [
            "Read the short learning summary.",
            "Click confirm after reading to unlock your reward."
        ],
        "requirements": "Read the summary for at least 15 seconds.",
        "verification_type": "READING_CONFIRM",
        "interactive_data": {
            "type": "READING",
            "reading_passage": "The Power of 1% Daily Improvements:\n\nImproving by just 1% each day creates compound growth: (1.01)^365 = 37.78x better by the end of one full year. Consistency beats sporadic intensity every single time. Establishing a clear routine, removing friction, and tracking your daily streak keeps motivation high.",
            "min_reading_seconds": 10
        },
        "is_daily": False,
        "status": TaskStatus.ACTIVE
    },
    {
        "title": "Financial Literacy & Smart Investing Primer",
        "description": "Learn the essential rules of compound interest, emergency funds, and diversification.",
        "category": TaskCategory.LEARNING,
        "difficulty": TaskDifficulty.EASY,
        "points": 125,
        "time_limit_minutes": 3,
        "instructions": [
            "Read the core financial planning rules.",
            "Verify your understanding to claim +125 points."
        ],
        "requirements": "Read and confirm.",
        "verification_type": "READING_CONFIRM",
        "interactive_data": {
            "type": "READING",
            "reading_passage": "Rule of 72 in Personal Finance:\n\nTo estimate how many years it takes for an investment to double at a fixed annual rate of return, divide 72 by the annual interest rate. For example, at an 8% annual return, your money doubles in approximately 72 / 8 = 9 years. Starting early allows compounding to maximize returns.",
            "min_reading_seconds": 10
        },
        "is_daily": False,
        "status": TaskStatus.ACTIVE
    },

    # 6. 2 BEGINNER CODING TASKS
    {
        "title": "Complete the Beginner Coding Challenge",
        "description": "Write or identify the correct Python keyword used to define a reusable function block.",
        "category": TaskCategory.CODING,
        "difficulty": TaskDifficulty.EASY,
        "points": 250,
        "time_limit_minutes": 5,
        "instructions": [
            "Review the basic Python code snippet.",
            "Submit the exact keyword or answer."
        ],
        "requirements": "Submit the valid Python function keyword.",
        "verification_type": "TEXT_ANSWER",
        "interactive_data": {
            "type": "TEXT_ANSWER",
            "question": "Which Python keyword is used to declare a function header (e.g. '____ calculate_total(a, b):')?",
            "expected_answer": "def",
            "hint": "It is a 3-letter keyword starting with 'd'."
        },
        "is_daily": False,
        "status": TaskStatus.ACTIVE
    },
    {
        "title": "Python Variable & List Indexing Quick Check",
        "description": "Verify zero-based indexing in modern programming languages like Python and JavaScript.",
        "category": TaskCategory.CODING,
        "difficulty": TaskDifficulty.EASY,
        "points": 150,
        "time_limit_minutes": 2,
        "instructions": [
            "Examine the list: fruits = ['apple', 'banana', 'cherry'].",
            "Select the value returned by fruits[0]."
        ],
        "requirements": "Select correct element.",
        "verification_type": "INTERACTIVE_QUIZ",
        "interactive_data": {
            "type": "QUIZ",
            "question": "In Python, given fruits = ['apple', 'banana', 'cherry'], what does fruits[0] evaluate to?",
            "options": ["'apple'", "'banana'", "'cherry'", "IndexError"],
            "correct_option_index": 0,
            "hint": "Python list indices start at 0."
        },
        "is_daily": False,
        "status": TaskStatus.ACTIVE
    },

    # 7. 5 SPECIAL TASKS (250–500 Points)
    {
        "title": "Full-Stack Architecture & Microservices Review",
        "description": "Evaluate decoupled frontend architectures, CDN caching, and asynchronous message broker patterns.",
        "category": TaskCategory.BONUS_TASK,
        "difficulty": TaskDifficulty.MEDIUM,
        "points": 400,
        "time_limit_minutes": 10,
        "instructions": [
            "Review microservice communication protocols.",
            "Answer the architectural question."
        ],
        "requirements": "Select correct architecture answer.",
        "verification_type": "INTERACTIVE_QUIZ",
        "interactive_data": {
            "type": "QUIZ",
            "question": "Which message broker is widely used for high-throughput distributed event streaming and log ingestion?",
            "options": ["Apache Kafka", "SQLite", "jQuery", "Bootstrap"],
            "correct_option_index": 0,
            "hint": "Originally developed by LinkedIn and open-sourced under Apache."
        },
        "is_daily": False,
        "status": TaskStatus.ACTIVE
    },
    {
        "title": "SQL Database Optimization Challenge",
        "description": "Analyze query performance, B-tree indexes, and execution plans for large database tables.",
        "category": TaskCategory.BONUS_TASK,
        "difficulty": TaskDifficulty.HARD,
        "points": 500,
        "time_limit_minutes": 15,
        "instructions": [
            "Review the SQL query optimization prompt.",
            "Submit the SQL command keyword used to inspect execution plans."
        ],
        "requirements": "Submit the execution analysis command.",
        "verification_type": "TEXT_ANSWER",
        "interactive_data": {
            "type": "TEXT_ANSWER",
            "question": "What SQL command keyword is placed before a SELECT statement to display the optimizer's query execution plan?",
            "expected_answer": "explain",
            "hint": "Starts with 'EX' and describes how PostgreSQL/MySQL will run the query."
        },
        "is_daily": False,
        "status": TaskStatus.ACTIVE
    },
    {
        "title": "System Design: Load Balancing & High Availability",
        "description": "Understand round-robin load balancing, health checks, and horizontal scaling strategies.",
        "category": TaskCategory.STREAK_TASK,
        "difficulty": TaskDifficulty.MEDIUM,
        "points": 350,
        "time_limit_minutes": 8,
        "instructions": [
            "Analyze high-availability concepts.",
            "Select the correct load balancing mechanism."
        ],
        "requirements": "Answer correctly.",
        "verification_type": "INTERACTIVE_QUIZ",
        "interactive_data": {
            "type": "QUIZ",
            "question": "What is the primary benefit of deploying an Application Load Balancer (ALB) in front of web servers?",
            "options": [
                "Distributing incoming traffic evenly across healthy server instances",
                "Increasing the hard drive capacity of the client machine",
                "Permanently deleting spam emails from users' inboxes",
                "Replacing the need for writing application business logic"
            ],
            "correct_option_index": 0,
            "hint": "Prevents any single server from becoming an overloaded single point of failure."
        },
        "is_daily": False,
        "status": TaskStatus.ACTIVE
    },
    {
        "title": "Cybersecurity Vulnerability Audit",
        "description": "Identify common OWASP Top 10 vulnerabilities including SQL injection, XSS, and CSRF attacks.",
        "category": TaskCategory.BONUS_TASK,
        "difficulty": TaskDifficulty.MEDIUM,
        "points": 300,
        "time_limit_minutes": 8,
        "instructions": [
            "Examine web application vulnerability defenses.",
            "Select the primary prevention mechanism for SQL Injection."
        ],
        "requirements": "Select correct security defense.",
        "verification_type": "INTERACTIVE_QUIZ",
        "interactive_data": {
            "type": "QUIZ",
            "question": "What is the most effective defense against SQL Injection attacks in web applications?",
            "options": [
                "Parameterized queries and prepared statements",
                "Hiding the database password in client-side HTML comments",
                "Using only uppercase characters in SQL queries",
                "Disabling database backups"
            ],
            "correct_option_index": 0,
            "hint": "Ensures user input is always treated as data rather than executable code."
        },
        "is_daily": False,
        "status": TaskStatus.ACTIVE
    },
    {
        "title": "Weekend Mega Knowledge Quest",
        "description": "Special weekend milestone quest! Test your multidisciplinary knowledge across science, tech, and geography for +500 points.",
        "category": TaskCategory.BONUS_TASK,
        "difficulty": TaskDifficulty.MEDIUM,
        "points": 500,
        "time_limit_minutes": 10,
        "instructions": [
            "Answer the mega quest challenge question.",
            "Claim your exclusive +500 point bonus."
        ],
        "requirements": "Complete mega quest.",
        "verification_type": "INTERACTIVE_QUIZ",
        "interactive_data": {
            "type": "QUIZ",
            "question": "Which elementary particle carries a positive electric charge and resides inside atomic nuclei with neutrons?",
            "options": ["Proton", "Electron", "Photon", "Neutrino"],
            "correct_option_index": 0,
            "hint": "The number of these particles defines the atomic number of an element."
        },
        "is_daily": False,
        "status": TaskStatus.ACTIVE
    }
]

QUIZZES_DATA = [
    {
        "title": "Python & Backend Engineering Mastery",
        "description": "Test your core knowledge of Python 3.12+, async I/O, decorators, memory management, and FastAPI mechanics.",
        "category": "Technology",
        "difficulty": "Medium",
        "duration_seconds": 180,
        "passing_score_percentage": 60,
        "questions": [
            {
                "question": "Which Python decorator is used to define an asynchronous route handler in FastAPI?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["@app.route()", "@app.get() or @app.post()", "@app.async_handler()", "@fastapi.endpoint()"],
                "correct_option_index": 1,
                "explanation": "FastAPI uses HTTP-verb decorators directly on the FastAPI or APIRouter instance, such as @app.get() or @app.post().",
                "points": 20
            },
            {
                "question": "What is the primary function of Python's Global Interpreter Lock (GIL)?",
                "question_type": "MULTIPLE_CHOICE",
                "options": [
                    "To speed up network requests",
                    "To ensure thread-safe memory management in CPython by allowing only one native thread to execute Python bytecode at a time",
                    "To compile Python code to machine code",
                    "To encrypt variable names in memory"
                ],
                "correct_option_index": 1,
                "explanation": "The GIL is a mutex that prevents multiple native threads from executing Python bytecodes concurrently to ensure thread safety in CPython memory management.",
                "points": 20
            },
            {
                "question": "In Python, dictionaries maintain insertion order starting from version 3.7+.",
                "question_type": "TRUE_FALSE",
                "options": ["True", "False"],
                "correct_option_index": 0,
                "explanation": "True! Starting in Python 3.6 (CPython implementation detail) and formalized in Python 3.7 as language specification, standard dict objects preserve insertion order.",
                "points": 20
            },
            {
                "question": "Which HTTP status code signifies that a resource was successfully created on the server?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["200 OK", "201 Created", "202 Accepted", "204 No Content"],
                "correct_option_index": 1,
                "explanation": "HTTP 201 Created is the standard REST status code returned after a successful POST request that creates a new resource.",
                "points": 20
            },
            {
                "question": "What is the return type of an async Python function defined with 'async def'?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["A Coroutine object", "A Thread object", "A Future only", "A Generator"],
                "correct_option_index": 0,
                "explanation": "Calling an async def function returns a coroutine object that can be awaited with 'await' inside an event loop.",
                "points": 20
            }
        ]
    },
    {
        "title": "Modern Web Development & React Architecture",
        "description": "Evaluate your understanding of React hooks, Virtual DOM diffing, JSX rendering, and state management patterns.",
        "category": "Coding",
        "difficulty": "Medium",
        "duration_seconds": 180,
        "passing_score_percentage": 60,
        "questions": [
            {
                "question": "Which React hook is specifically used for running side effects such as data fetching or subscriptions?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["useState", "useMemo", "useEffect", "useCallback"],
                "correct_option_index": 2,
                "explanation": "useEffect lets you synchronize a component with external systems such as timers, DOM mutations, and API requests.",
                "points": 20
            },
            {
                "question": "What is the purpose of the 'key' prop when rendering lists in React?",
                "question_type": "MULTIPLE_CHOICE",
                "options": [
                    "To style each list element with CSS",
                    "To help React identify which items have changed, been added, or removed for efficient reconciliation",
                    "To encrypt the data on the client",
                    "To sort the list alphabetically automatically"
                ],
                "correct_option_index": 1,
                "explanation": "Unique keys give list elements a stable identity, allowing React's Virtual DOM reconciliation engine to minimize costly DOM re-renders.",
                "points": 20
            },
            {
                "question": "React state updates using the setter function from useState are asynchronous and batched.",
                "question_type": "TRUE_FALSE",
                "options": ["True", "False"],
                "correct_option_index": 0,
                "explanation": "True! React batches state updates across event handlers and effects for optimal rendering performance.",
                "points": 20
            },
            {
                "question": "Which hook would you use to memoize an expensive calculation between re-renders?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["useCallback", "useMemo", "useRef", "useReducer"],
                "correct_option_index": 1,
                "explanation": "useMemo caches the result of an expensive calculation based on its dependency array.",
                "points": 20
            },
            {
                "question": "In TypeScript, what keyword is used to create a union type?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["&", "|", "^", "%"],
                "correct_option_index": 1,
                "explanation": "The pipe symbol '|' is used to define union types in TypeScript (e.g. 'string | number').",
                "points": 20
            }
        ]
    },
    {
        "title": "Fintech & Digital Banking Essentials",
        "description": "Test your knowledge on modern payment systems, UPI architecture, encryption protocols, and tokenization.",
        "category": "General Knowledge",
        "difficulty": "Easy",
        "duration_seconds": 150,
        "passing_score_percentage": 60,
        "questions": [
            {
                "question": "What does UPI stand for in modern digital finance?",
                "question_type": "MULTIPLE_CHOICE",
                "options": [
                    "Universal Payment Identifier",
                    "Unified Payments Interface",
                    "United Postal Institution",
                    "Uniform Protocol for Internet"
                ],
                "correct_option_index": 1,
                "explanation": "UPI stands for Unified Payments Interface, developed by the National Payments Corporation of India (NPCI).",
                "points": 20
            },
            {
                "question": "What is the standard character length of an Indian Financial System Code (IFSC)?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["8 characters", "10 characters", "11 characters", "16 characters"],
                "correct_option_index": 2,
                "explanation": "An IFSC code is an 11-character alphanumeric code with the first 4 characters representing the bank and the 5th character always being 0.",
                "points": 20
            },
            {
                "question": "Card Tokenization replaces actual 16-digit debit/credit card numbers with unique surrogate tokens for secure online storage.",
                "question_type": "TRUE_FALSE",
                "options": ["True", "False"],
                "correct_option_index": 0,
                "explanation": "True! Tokenization enhances cybersecurity by ensuring merchant servers do not store raw card numbers.",
                "points": 20
            },
            {
                "question": "Which protocol is the global standard for secure web communication over HTTPS?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["TLS (Transport Layer Security)", "FTP", "SNMP", "TELNET"],
                "correct_option_index": 0,
                "explanation": "TLS (and its predecessor SSL) encrypts communications between web browsers and servers.",
                "points": 20
            },
            {
                "question": "What is a 2FA / MFA authentication mechanism in financial apps?",
                "question_type": "MULTIPLE_CHOICE",
                "options": [
                    "Two Factor Authentication",
                    "Two Fastest Algorithms",
                    "Timed File Allocation",
                    "Total Fixed Assets"
                ],
                "correct_option_index": 0,
                "explanation": "Two-Factor Authentication (2FA) requires two distinct verification factors (e.g. password + OTP/biometric).",
                "points": 20
            }
        ]
    },
    {
        "title": "Database Architecture & MongoDB Skills",
        "description": "Assess your understanding of document databases, BSON, indexing strategies, and ACID transactions.",
        "category": "Technology",
        "difficulty": "Medium",
        "duration_seconds": 180,
        "passing_score_percentage": 60,
        "questions": [
            {
                "question": "What binary serialization format does MongoDB use to store documents and make remote procedure calls?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["JSON", "BSON (Binary JSON)", "YAML", "Protocol Buffers"],
                "correct_option_index": 1,
                "explanation": "MongoDB stores data records as BSON documents, which is a binary representation of JSON supporting additional data types like dates and ObjectIds.",
                "points": 20
            },
            {
                "question": "Which MongoDB operator is used to atomically increment the numeric value of a field?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["$add", "$inc", "$plus", "$set"],
                "correct_option_index": 1,
                "explanation": "The $inc operator increments a field by a specified value atomically.",
                "points": 20
            },
            {
                "question": "In MongoDB, indexes can be configured with a 'unique: true' constraint to prevent duplicate keys.",
                "question_type": "TRUE_FALSE",
                "options": ["True", "False"],
                "correct_option_index": 0,
                "explanation": "True! Unique indexes reject document insertions that would result in duplicate values for indexed fields.",
                "points": 20
            },
            {
                "question": "Which stage in a MongoDB aggregation pipeline filters documents similar to a SQL WHERE clause?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["$filter", "$match", "$where", "$project"],
                "correct_option_index": 1,
                "explanation": "The $match aggregation stage filters the document stream to allow only matching documents to pass to the next stage.",
                "points": 20
            },
            {
                "question": "What is the primary key field name automatically generated in MongoDB collections?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["id", "pk", "_id", "uuid"],
                "correct_option_index": 2,
                "explanation": "In MongoDB, every document stored in a collection requires a unique '_id' field that serves as its primary key.",
                "points": 20
            }
        ]
    },
    {
        "title": "World History & Inventions Trivia",
        "description": "Engage your mind with questions on historic breakthroughs, famous inventors, and global heritage.",
        "category": "General Knowledge",
        "difficulty": "Easy",
        "duration_seconds": 150,
        "passing_score_percentage": 60,
        "questions": [
            {
                "question": "Who is widely credited with inventing the World Wide Web in 1989 while working at CERN?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["Tim Berners-Lee", "Alan Turing", "Vint Cerf", "Bill Gates"],
                "correct_option_index": 0,
                "explanation": "Sir Tim Berners-Lee invented the World Wide Web in 1989, including HTTP, HTML, and the first web browser.",
                "points": 20
            },
            {
                "question": "Which ancient wonder was located in Alexandria, Egypt and served as a navigational beacon?",
                "question_type": "MULTIPLE_CHOICE",
                "options": [
                    "The Colossus of Rhodes",
                    "The Lighthouse of Alexandria (Pharos)",
                    "The Hanging Gardens of Babylon",
                    "The Statue of Zeus"
                ],
                "correct_option_index": 1,
                "explanation": "The Lighthouse of Alexandria, constructed during the Ptolemaic Kingdom, was one of the Seven Wonders of the Ancient World.",
                "points": 20
            },
            {
                "question": "Alexander Fleming discovered penicillin in 1928, marking the dawn of modern antibiotics.",
                "question_type": "TRUE_FALSE",
                "options": ["True", "False"],
                "correct_option_index": 0,
                "explanation": "True! Fleming observed that Penicillium notatum mold prevented staphylococcus bacterial growth.",
                "points": 20
            },
            {
                "question": "In what year did the Apollo 11 mission successfully land the first humans on the Moon?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["1965", "1969", "1972", "1975"],
                "correct_option_index": 1,
                "explanation": "Neil Armstrong and Buzz Aldrin landed the Apollo 11 Lunar Module on the Moon on July 20, 1969.",
                "points": 20
            },
            {
                "question": "What is the longest river in the world by general scientific consensus?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["Amazon River", "Nile River", "Yangtze River", "Mississippi River"],
                "correct_option_index": 1,
                "explanation": "The Nile River in northeastern Africa is traditionally recognized as the world's longest river at approximately 6,650 km (4,132 miles).",
                "points": 20
            }
        ]
    },
    {
        "title": "Cybersecurity & Data Privacy Challenge",
        "description": "Test your reflexes against social engineering tactics, hashing vs encryption, and password entropy.",
        "category": "Technology",
        "difficulty": "Hard",
        "duration_seconds": 180,
        "passing_score_percentage": 60,
        "questions": [
            {
                "question": "What is the primary difference between hashing and encryption?",
                "question_type": "MULTIPLE_CHOICE",
                "options": [
                    "Hashing is two-way, encryption is one-way",
                    "Hashing is a one-way irreversible mathematical function, while encryption is two-way and reversible with a key",
                    "Encryption cannot be decrypted",
                    "There is no difference"
                ],
                "correct_option_index": 1,
                "explanation": "Cryptographic hashes (like bcrypt/SHA-256) cannot be decrypted back to plaintext, whereas encryption is designed to be decrypted with the appropriate private/secret key.",
                "points": 20
            },
            {
                "question": "What type of attack involves an attacker sending immense volumes of traffic to overwhelm server capacity?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["SQL Injection", "DDoS (Distributed Denial of Service)", "Cross-Site Scripting (XSS)", "Buffer Overflow"],
                "correct_option_index": 1,
                "explanation": "DDoS attacks flood target web applications with distributed malicious traffic to cause downtime.",
                "points": 20
            },
            {
                "question": "Using a unique cryptographic salt for each hashed password protects against precomputed rainbow table attacks.",
                "question_type": "TRUE_FALSE",
                "options": ["True", "False"],
                "correct_option_index": 0,
                "explanation": "True! Salts ensure that identical passwords generate completely different hash outputs, rendering rainbow tables useless.",
                "points": 20
            },
            {
                "question": "What does CORS stand for in web security architecture?",
                "question_type": "MULTIPLE_CHOICE",
                "options": [
                    "Cross-Origin Resource Sharing",
                    "Centralized Online Routing Standard",
                    "Cryptographic Origin Relay System",
                    "Client-Oriented Rendering Server"
                ],
                "correct_option_index": 0,
                "explanation": "Cross-Origin Resource Sharing (CORS) is an HTTP-header based mechanism that allows a server to indicate any origins other than its own from which a browser should permit loading resources.",
                "points": 20
            },
            {
                "question": "Which authentication token standard uses three base64-encoded segments: Header, Payload, and Signature?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["OAuth1", "JWT (JSON Web Token)", "SAML 1.0", "Cookie Session ID"],
                "correct_option_index": 1,
                "explanation": "JWTs consist of header.payload.signature separated by dots.",
                "points": 20
            }
        ]
    },
    {
        "title": "Science & Nature Expedition Quiz",
        "description": "Explore the wonders of biology, astrophysics, quantum physics, and Earth's ecosystems.",
        "category": "Education",
        "difficulty": "Medium",
        "duration_seconds": 180,
        "passing_score_percentage": 60,
        "questions": [
            {
                "question": "What is the powerhouse organelle of eukaryotic cells responsible for producing ATP?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["Nucleus", "Ribosome", "Mitochondria", "Golgi Apparatus"],
                "correct_option_index": 2,
                "explanation": "Mitochondria generate most of the chemical energy (ATP) needed to power the cell's biochemical reactions.",
                "points": 20
            },
            {
                "question": "What is the approximate speed of light in a vacuum?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["150,000 km/s", "299,792 km/s", "500,000 km/s", "1,080,000 km/s"],
                "correct_option_index": 1,
                "explanation": "The speed of light in a vacuum is exactly 299,792,458 meters per second (approx 300,000 km/s).",
                "points": 20
            },
            {
                "question": "Water reaches its maximum physical density at approximately 4 degrees Celsius (39.2°F).",
                "question_type": "TRUE_FALSE",
                "options": ["True", "False"],
                "correct_option_index": 0,
                "explanation": "True! Water expands as it cools below 4°C and freezes, which is why ice floats on water.",
                "points": 20
            },
            {
                "question": "Which gas is the most abundant element in Earth's atmosphere by volume?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["Oxygen (O2)", "Nitrogen (N2)", "Carbon Dioxide (CO2)", "Argon (Ar)"],
                "correct_option_index": 1,
                "explanation": "Nitrogen makes up approximately 78% of Earth's atmosphere, followed by oxygen at roughly 21%.",
                "points": 20
            },
            {
                "question": "How many bones are present in the adult human skeleton?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["186", "206", "226", "256"],
                "correct_option_index": 1,
                "explanation": "An adult human skeleton is composed of 206 individual bones.",
                "points": 20
            }
        ]
    },
    {
        "title": "Cloud DevOps & CI/CD Pipelines",
        "description": "Master continuous integration, infrastructure as code, container orchestration, and telemetry.",
        "category": "Technology",
        "difficulty": "Hard",
        "duration_seconds": 180,
        "passing_score_percentage": 60,
        "questions": [
            {
                "question": "In Kubernetes architecture, what is the smallest deployable compute unit that can be created and managed?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["Node", "Pod", "Cluster", "Service"],
                "correct_option_index": 1,
                "explanation": "A Pod is the smallest execution unit in Kubernetes, representing a single instance of a running process in your cluster.",
                "points": 20
            },
            {
                "question": "What is the primary benefit of Infrastructure as Code (IaC) tools like Terraform?",
                "question_type": "MULTIPLE_CHOICE",
                "options": [
                    "Manual GUI provisioning",
                    "Declarative, reproducible, version-controlled cloud infrastructure management",
                    "Replacing all database queries",
                    "Automatic frontend translation"
                ],
                "correct_option_index": 1,
                "explanation": "IaC allows developers to define and provision data center infrastructure using declarative configuration files.",
                "points": 20
            },
            {
                "question": "Blue-Green deployment allows zero-downtime releases by routing live traffic between two identical production environments.",
                "question_type": "TRUE_FALSE",
                "options": ["True", "False"],
                "correct_option_index": 0,
                "explanation": "True! Blue-Green deployments minimize downtime and rollback risk by switching the router/load-balancer target.",
                "points": 20
            },
            {
                "question": "Which metric measures the percentage of requests that succeed without throwing errors?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["Latency", "Availability / Uptime", "Throughput", "Saturation"],
                "correct_option_index": 1,
                "explanation": "Availability (SLO/SLA) measures service uptime and successful request ratios.",
                "points": 20
            },
            {
                "question": "What is the standard configuration file format used by GitHub Actions workflows?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["JSON", "YAML (.yml)", "XML", "TOML"],
                "correct_option_index": 1,
                "explanation": "GitHub Actions workflows are defined in YAML syntax in the .github/workflows directory.",
                "points": 20
            }
        ]
    },
    {
        "title": "World Geography & Landmarks Quiz",
        "description": "Travel across continents and test your knowledge of capitals, mountain ranges, and oceans.",
        "category": "General Knowledge",
        "difficulty": "Easy",
        "duration_seconds": 150,
        "passing_score_percentage": 60,
        "questions": [
            {
                "question": "What is the capital city of Australia?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["Sydney", "Melbourne", "Canberra", "Brisbane"],
                "correct_option_index": 2,
                "explanation": "Canberra is the federal capital city of Australia, chosen as a compromise between Sydney and Melbourne.",
                "points": 20
            },
            {
                "question": "Which is the highest mountain peak in the world above sea level?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["K2", "Mount Everest", "Kangchenjunga", "Lhotse"],
                "correct_option_index": 1,
                "explanation": "Mount Everest reaches an elevation of 8,848.86 meters (29,031.7 ft) in the Himalayas.",
                "points": 20
            },
            {
                "question": "The equator passes through both the African and South American continents.",
                "question_type": "TRUE_FALSE",
                "options": ["True", "False"],
                "correct_option_index": 0,
                "explanation": "True! The equator passes through Ecuador, Colombia, and Brazil in South America, as well as multiple African countries.",
                "points": 20
            },
            {
                "question": "What is the deepest known ocean trench on Earth?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["Puerto Rico Trench", "Mariana Trench (Challenger Deep)", "Java Trench", "Tonga Trench"],
                "correct_option_index": 1,
                "explanation": "The Mariana Trench reaches a maximum known depth of nearly 11,000 meters (36,000 feet) in the western Pacific Ocean.",
                "points": 20
            },
            {
                "question": "Which country has the greatest number of natural lakes in the world?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["United States", "Russia", "Canada", "Finland"],
                "correct_option_index": 2,
                "explanation": "Canada contains over 60% of all the natural lakes in the world.",
                "points": 20
            }
        ]
    },
    {
        "title": "Computer Hardware & Networking Fundamentals",
        "description": "Learn the inner workings of CPUs, RAM, OSI layers, DNS resolution, and TCP/IP routing.",
        "category": "Technology",
        "difficulty": "Medium",
        "duration_seconds": 180,
        "passing_score_percentage": 60,
        "questions": [
            {
                "question": "How many layers are defined in the theoretical Open Systems Interconnection (OSI) network model?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["4 layers", "5 layers", "7 layers", "9 layers"],
                "correct_option_index": 2,
                "explanation": "The OSI model consists of 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, and Application.",
                "points": 20
            },
            {
                "question": "What is the primary role of the Domain Name System (DNS) on the internet?",
                "question_type": "MULTIPLE_CHOICE",
                "options": [
                    "To compress video streams",
                    "To translate human-readable domain names (e.g. task2cash.com) into numerical IP addresses",
                    "To manage firewall rules",
                    "To encrypt emails"
                ],
                "correct_option_index": 1,
                "explanation": "DNS acts as the phonebook of the internet by translating domain names to IP addresses.",
                "points": 20
            },
            {
                "question": "TCP is a connection-oriented protocol that guarantees packet delivery order and error-checking, whereas UDP is connectionless.",
                "question_type": "TRUE_FALSE",
                "options": ["True", "False"],
                "correct_option_index": 0,
                "explanation": "True! TCP uses a 3-way handshake and retransmission for reliable delivery, while UDP prioritizes speed with lower overhead.",
                "points": 20
            },
            {
                "question": "Which volatile memory component is used by the CPU for high-speed temporary data storage while applications run?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["Hard Disk Drive", "RAM (Random Access Memory)", "ROM", "Flash Drive"],
                "correct_option_index": 1,
                "explanation": "RAM is high-speed volatile storage that holds data and instructions that the processor needs in real-time.",
                "points": 20
            },
            {
                "question": "What is the default port used for secure HTTPS web traffic?",
                "question_type": "MULTIPLE_CHOICE",
                "options": ["80", "443", "8080", "22"],
                "correct_option_index": 1,
                "explanation": "Port 443 is the standard port for HTTPS, while port 80 is used for unencrypted HTTP.",
                "points": 20
            }
        ]
    }
]

REWARDS_DATA = [
    {
        "name": "Airtel Mobile Recharge (Demo)",
        "description": "Instant simulated mobile recharge for any prepaid Airtel number.",
        "type": RewardType.MOBILE_RECHARGE,
        "required_points": 1000,
        "demo_cash_value": 10.00,
        "icon_name": "Smartphone",
        "category": "Recharge",
        "min_level_required": "Bronze",
        "daily_limit": 5,
        "status": RewardStatus.ACTIVE
    },
    {
        "name": "Jio Data Booster Pack (Demo)",
        "description": "Simulated 1GB high-speed 4G/5G data voucher for Reliance Jio prepaid connections.",
        "type": RewardType.MOBILE_RECHARGE,
        "required_points": 1900,
        "demo_cash_value": 19.00,
        "icon_name": "Smartphone",
        "category": "Recharge",
        "min_level_required": "Bronze",
        "daily_limit": 5,
        "status": RewardStatus.ACTIVE
    },
    {
        "name": "Vi Unlimited Validity Top-up (Demo)",
        "description": "Simulated talktime and service validity recharge for Vodafone Idea.",
        "type": RewardType.MOBILE_RECHARGE,
        "required_points": 1500,
        "demo_cash_value": 15.00,
        "icon_name": "Smartphone",
        "category": "Recharge",
        "min_level_required": "Bronze",
        "daily_limit": 5,
        "status": RewardStatus.ACTIVE
    },
    {
        "name": "₹50 UPI Instant Transfer (Demo)",
        "description": "Instant simulated UPI payout directly to your Virtual Payment Address (GPay / PhonePe / Paytm).",
        "type": RewardType.UPI_PAYOUT,
        "required_points": 5000,
        "demo_cash_value": 50.00,
        "icon_name": "CreditCard",
        "category": "UPI Payout",
        "min_level_required": "Silver",
        "daily_limit": 3,
        "status": RewardStatus.ACTIVE
    },
    {
        "name": "₹100 UPI Express Payout (Demo)",
        "description": "Fast simulated UPI payout to your registered handle in sandbox test mode.",
        "type": RewardType.UPI_PAYOUT,
        "required_points": 10000,
        "demo_cash_value": 100.00,
        "icon_name": "CreditCard",
        "category": "UPI Payout",
        "min_level_required": "Gold",
        "daily_limit": 3,
        "status": RewardStatus.ACTIVE
    },
    {
        "name": "₹500 Direct Bank Payout (Demo)",
        "description": "Simulated IMPS/NEFT transfer directly to your savings/current account.",
        "type": RewardType.BANK_TRANSFER,
        "required_points": 50000,
        "demo_cash_value": 500.00,
        "icon_name": "Building2",
        "category": "Bank Transfer",
        "min_level_required": "Gold",
        "daily_limit": 2,
        "status": RewardStatus.ACTIVE
    },
    {
        "name": "₹1,000 VIP Bank Transfer (Demo)",
        "description": "Simulated high-value direct bank transfer for top tier earners.",
        "type": RewardType.BANK_TRANSFER,
        "required_points": 100000,
        "demo_cash_value": 1000.00,
        "icon_name": "Building2",
        "category": "Bank Transfer",
        "min_level_required": "Platinum",
        "daily_limit": 2,
        "status": RewardStatus.ACTIVE
    },
    {
        "name": "Amazon Pay ₹100 E-Gift Card (Demo)",
        "description": "Simulated Amazon Pay digital claim code delivered directly to your email.",
        "type": RewardType.GIFT_CARD,
        "required_points": 10000,
        "demo_cash_value": 100.00,
        "icon_name": "Gift",
        "category": "Gift Cards",
        "min_level_required": "Silver",
        "daily_limit": 4,
        "status": RewardStatus.ACTIVE
    },
    {
        "name": "Google Play ₹50 Recharge Code (Demo)",
        "description": "Simulated Google Play Store credit code for apps, books, and in-game upgrades.",
        "type": RewardType.GIFT_CARD,
        "required_points": 5000,
        "demo_cash_value": 50.00,
        "icon_name": "Play",
        "category": "Gift Cards",
        "min_level_required": "Bronze",
        "daily_limit": 4,
        "status": RewardStatus.ACTIVE
    },
    {
        "name": "Flipkart ₹250 Shopping Voucher (Demo)",
        "description": "Simulated Flipkart e-voucher code with instant sandbox redemption simulation.",
        "type": RewardType.GIFT_CARD,
        "required_points": 25000,
        "demo_cash_value": 250.00,
        "icon_name": "ShoppingBag",
        "category": "Gift Cards",
        "min_level_required": "Gold",
        "daily_limit": 3,
        "status": RewardStatus.ACTIVE
    }
]

async def seed_all():
    await connect_to_mongo()
    db = get_database()
    logger.info("Starting database seeding for database '%s'...", settings.DB_NAME)

    now = datetime.now(timezone.utc)

    # 1. Clear old collections for clean seed
    await db.users.delete_many({"email": {"$ne": settings.ADMIN_EMAIL.lower()}})
    await db.tasks.delete_many({})
    await db.quizzes.delete_many({})
    await db.rewards.delete_many({})
    await db.point_transactions.delete_many({})
    await db.wallets.delete_many({})
    await db.daily_streaks.delete_many({})
    await db.user_achievements.delete_many({})
    await db.notifications.delete_many({})
    await db.redemptions.delete_many({})
    await db.withdrawals.delete_many({})
    await db.referrals.delete_many({})
    await db.fraud_events.delete_many({})

    logger.info("Purged old collections (preserved admin if present).")

    # 2. Seed Tasks
    task_ids = []
    for task_data in TASKS_DATA:
        t_id = str(uuid.uuid4())
        task_ids.append(t_id)
        doc = {
            "_id": t_id,
            **task_data,
            "completions_count": random.randint(15, 120),
            "created_at": now - timedelta(days=random.randint(2, 30)),
            "updated_at": now
        }
        await db.tasks.insert_one(doc)
    logger.info("Seeded %d categorized tasks.", len(TASKS_DATA))

    # 3. Seed Quizzes
    quiz_ids = []
    for quiz_data in QUIZZES_DATA:
        q_id = str(uuid.uuid4())
        quiz_ids.append(q_id)
        
        # Ensure questions have unique IDs
        processed_questions = []
        for idx, q in enumerate(quiz_data["questions"]):
            q_copy = dict(q)
            q_copy["id"] = f"q_{idx+1}_{uuid.uuid4().hex[:6]}"
            processed_questions.append(q_copy)

        doc = {
            "_id": q_id,
            "title": quiz_data["title"],
            "description": quiz_data["description"],
            "category": quiz_data["category"],
            "difficulty": quiz_data["difficulty"],
            "duration_seconds": quiz_data["duration_seconds"],
            "passing_score_percentage": quiz_data["passing_score_percentage"],
            "questions": processed_questions,
            "status": "ACTIVE",
            "cover_image": None,
            "attempts_count": random.randint(25, 200),
            "created_at": now - timedelta(days=random.randint(3, 40)),
            "updated_at": now
        }
        await db.quizzes.insert_one(doc)
    logger.info("Seeded %d quizzes with %d total questions.", len(QUIZZES_DATA), sum(len(q['questions']) for q in QUIZZES_DATA))

    # 4. Seed Rewards
    reward_ids = []
    for rew_data in REWARDS_DATA:
        r_id = str(uuid.uuid4())
        reward_ids.append(r_id)
        doc = {
            "_id": r_id,
            **rew_data,
            "created_at": now - timedelta(days=random.randint(5, 45)),
            "updated_at": now
        }
        await db.rewards.insert_one(doc)
    logger.info("Seeded %d rewards in catalog.", len(REWARDS_DATA))

    # 5. Seed 20 Demo Users with Wallets, Streaks, and Histories
    demo_user_ids = []
    common_pw_hash = get_password_hash("Password@123")

    for idx, (name, email, mobile, level, pts, streak_days) in enumerate(DEMO_USERS_DATA):
        u_id = str(uuid.uuid4())
        demo_user_ids.append(u_id)
        ref_code = f"T2C-{name.split()[0].upper()[:4]}{random.randint(100, 999)}"

        tasks_done = random.randint(3, 18)
        quizzes_done = random.randint(2, 10)
        perfect_q = random.randint(1, 4) if quizzes_done > 2 else 0

        user_doc = {
            "_id": u_id,
            "full_name": name,
            "email": email,
            "mobile": mobile,
            "password_hash": common_pw_hash,
            "role": UserRole.USER,
            "status": "ACTIVE",
            "level": level,
            "xp": pts + random.randint(100, 1000),
            "points": pts,
            "streak_count": streak_days,
            "tasks_completed": tasks_done,
            "quizzes_completed": quizzes_done,
            "perfect_quizzes": perfect_q,
            "redemptions_count": random.randint(1, 4),
            "referrals_count": random.randint(0, 5),
            "referral_code": ref_code,
            "avatar_url": f"https://api.dicebear.com/7.x/bottts/svg?seed={name.replace(' ', '')}",
            "created_at": now - timedelta(days=random.randint(10, 60)),
            "updated_at": now
        }
        await db.users.insert_one(user_doc)

        # Wallet
        total_earned = pts + random.randint(2000, 8000)
        total_spent = total_earned - pts
        wallet_doc = {
            "_id": str(uuid.uuid4()),
            "user_id": u_id,
            "available_points": pts,
            "total_earned": total_earned,
            "total_spent": total_spent,
            "pending_points": 0,
            "locked_points": 0,
            "created_at": user_doc["created_at"],
            "updated_at": now
        }
        await db.wallets.insert_one(wallet_doc)

        # Streak Record
        streak_doc = {
            "_id": str(uuid.uuid4()),
            "user_id": u_id,
            "current_streak": streak_days,
            "longest_streak": max(streak_days, random.randint(streak_days, streak_days + 5)),
            "last_claim_date": (now - timedelta(days=0 if streak_days > 0 else 2)).strftime("%Y-%m-%d"),
            "total_streak_points": streak_days * 25,
            "history": [],
            "created_at": user_doc["created_at"],
            "updated_at": now
        }
        await db.daily_streaks.insert_one(streak_doc)

        # Point Transactions
        for t_i in range(min(5, tasks_done)):
            t_pts = random.choice([150, 200, 300, 350, 500])
            await db.point_transactions.insert_one({
                "_id": str(uuid.uuid4()),
                "user_id": u_id,
                "amount": t_pts,
                "balance_after": pts - ((5 - t_i) * 100),
                "type": "EARN",
                "status": "COMPLETED",
                "description": f"Completed Task Challenge (+{t_pts} pts)",
                "reference_type": "task",
                "reference_id": random.choice(task_ids),
                "created_at": now - timedelta(days=random.randint(1, 15))
            })

        # Sample Redemptions
        if idx % 2 == 0:
            rew = random.choice(REWARDS_DATA)
            await db.redemptions.insert_one({
                "_id": str(uuid.uuid4()),
                "user_id": u_id,
                "reward_id": random.choice(reward_ids),
                "reward_name": rew["name"],
                "reward_type": rew["type"],
                "points_spent": rew["required_points"],
                "demo_cash_value": rew["demo_cash_value"],
                "status": "COMPLETED",
                "transaction_id": f"DEMO-TX-{uuid.uuid4().hex[:8].upper()}",
                "target_destination": "9876543210 (Airtel)" if rew["type"] == RewardType.MOBILE_RECHARGE else "user@upi",
                "is_demo": True,
                "created_at": now - timedelta(days=random.randint(1, 10)),
                "completed_at": now - timedelta(days=random.randint(1, 10))
            })

        # Sample Notification
        await db.notifications.insert_one({
            "_id": str(uuid.uuid4()),
            "user_id": u_id,
            "title": "Welcome to Task2Cash!",
            "message": "Start earning points today by completing tasks and daily quizzes.",
            "type": "SYSTEM",
            "is_read": True,
            "created_at": user_doc["created_at"]
        })

    logger.info("Seeded %d demo users with realistic wallets and ledgers.", len(DEMO_USERS_DATA))

    # 6. Sample Fraud Events for Admin demonstration
    if demo_user_ids:
        await db.fraud_events.insert_one({
            "_id": str(uuid.uuid4()),
            "user_id": demo_user_ids[0],
            "event_type": "RAPID_POINT_ACCUMULATION",
            "risk_level": "MEDIUM",
            "reason": "User completed 4 high-value tasks in under 8 minutes.",
            "details": {"tasks_count": 4, "points": 1800, "timespan_minutes": 8},
            "status": "FLAGGED",
            "created_at": now - timedelta(hours=3),
            "updated_at": now - timedelta(hours=3)
        })
        await db.fraud_events.insert_one({
            "_id": str(uuid.uuid4()),
            "user_id": demo_user_ids[1],
            "event_type": "SUSPICIOUS_QUIZ_SPEED",
            "risk_level": "LOW",
            "reason": "Quiz attempt finished in 4 seconds with 100% accuracy.",
            "details": {"quiz_id": quiz_ids[0], "time_taken": 4},
            "status": "FLAGGED",
            "created_at": now - timedelta(hours=7),
            "updated_at": now - timedelta(hours=7)
        })
    logger.info("Seeded sample fraud alerts for admin review.")

    await close_mongo_connection()
    logger.info("Database seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed_all())
