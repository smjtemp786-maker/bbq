"""Static curriculum content used for idempotent seeding."""

COURSES = [
    {
        "slug": "coding-fundamentals",
        "title": "Coding Fundamentals",
        "description": "Learn programming logic through visual blocks: sequences, loops, events and variables.",
        "age_group": "8-12",
        "difficulty": "beginner",
        "duration": "6 weeks",
        "category": "coding",
        "thumbnail": "https://images.unsplash.com/photo-1603354350317-6f7aaa5911c5?crop=entropy&cs=srgb&fm=jpg&w=600&q=80",
        "modules": [
            {"title": "Getting Started with Blocks", "lessons": [
                {"title": "What is Programming?", "estimated_time": "15 min", "content": "Programming is giving a computer step-by-step instructions. In Brain Bonds we snap colourful blocks together to build these instructions."},
                {"title": "Your First Block Program", "estimated_time": "20 min", "content": "Use the WHEN START block and MOVE blocks to make things happen in order (a sequence)."},
            ]},
            {"title": "Loops & Repetition", "lessons": [
                {"title": "Repeating Actions", "estimated_time": "20 min", "content": "The REPEAT block runs the blocks inside it many times, saving you from copying blocks."},
                {"title": "Forever Loops", "estimated_time": "15 min", "content": "A FOREVER loop keeps running until you press Stop \u2014 perfect for games and robots."},
            ]},
            {"title": "Decisions & Variables", "lessons": [
                {"title": "IF / ELSE Decisions", "estimated_time": "25 min", "content": "IF blocks let programs make choices based on conditions."},
                {"title": "Using Variables", "estimated_time": "20 min", "content": "Variables store values like score or lives that change while your program runs."},
            ]},
        ],
    },
    {
        "slug": "game-development",
        "title": "Game Development",
        "description": "Build your own 2D games with block-based programming: characters, movement, score and collisions.",
        "age_group": "10-14",
        "difficulty": "intermediate",
        "duration": "8 weeks",
        "category": "game",
        "thumbnail": "https://images.unsplash.com/photo-1568585219057-9206080e6c74?crop=entropy&cs=srgb&fm=jpg&w=600&q=80",
        "modules": [
            {"title": "Game Basics", "lessons": [
                {"title": "Anatomy of a Game", "estimated_time": "20 min", "content": "Every game has sprites, a game loop, controls, and win/lose rules."},
                {"title": "Moving a Character", "estimated_time": "25 min", "content": "Read keyboard controls and change a sprite's position to move it."},
            ]},
            {"title": "Rules & Scoring", "lessons": [
                {"title": "Collision Detection", "estimated_time": "25 min", "content": "Detect when two sprites overlap to catch objects or hit enemies."},
                {"title": "Score, Lives & Game Over", "estimated_time": "25 min", "content": "Track score and lives with variables and end the game at the right time."},
            ]},
        ],
    },
    {
        "slug": "robotics-fundamentals",
        "title": "Robotics Fundamentals",
        "description": "Program a virtual robot with motors and sensors to navigate mazes and avoid obstacles.",
        "age_group": "10-14",
        "difficulty": "intermediate",
        "duration": "8 weeks",
        "category": "robotics",
        "thumbnail": "https://images.unsplash.com/photo-1737228813532-9cd720824ba7?crop=entropy&cs=srgb&fm=jpg&w=600&q=80",
        "modules": [
            {"title": "Meet the Robot", "lessons": [
                {"title": "Motors & Movement", "estimated_time": "20 min", "content": "Left and right motors let the robot move forward and turn."},
                {"title": "Reading Sensors", "estimated_time": "25 min", "content": "Ultrasonic and IR sensors tell the robot how far away obstacles are."},
            ]},
            {"title": "Autonomous Behaviour", "lessons": [
                {"title": "Obstacle Avoidance", "estimated_time": "30 min", "content": "Use IF distance < 20 THEN turn to avoid crashing into walls."},
                {"title": "Reaching a Goal", "estimated_time": "30 min", "content": "Combine sensing and movement to reach the target cell."},
            ]},
        ],
    },
    {
        "slug": "intro-to-ai",
        "title": "Introduction to AI",
        "description": "Discover how machines learn: classification, pattern recognition and chatbots \u2014 hands-on.",
        "age_group": "12-16",
        "difficulty": "beginner",
        "duration": "5 weeks",
        "category": "ai",
        "thumbnail": "https://images.unsplash.com/photo-1585980243496-fe29a36bd382?crop=entropy&cs=srgb&fm=jpg&w=600&q=80",
        "modules": [
            {"title": "What is AI?", "lessons": [
                {"title": "AI All Around Us", "estimated_time": "15 min", "content": "AI powers voice assistants, recommendations and self-driving cars."},
                {"title": "Teaching Machines", "estimated_time": "20 min", "content": "Machines learn from examples (data) instead of fixed rules."},
            ]},
            {"title": "AI in Action", "lessons": [
                {"title": "Pattern Recognition", "estimated_time": "25 min", "content": "AI finds patterns to tell cats from dogs or spam from real mail."},
                {"title": "Talking to a Chatbot", "estimated_time": "25 min", "content": "Chatbots use language models to understand and reply to you."},
            ]},
        ],
    },
]

# Quizzes keyed by course slug. Each question: id, type, text, options, answer, explanation
QUIZZES = {
    "coding-fundamentals": {
        "title": "Coding Fundamentals Quiz",
        "questions": [
            {"type": "mcq", "text": "Which block repeats actions a set number of times?", "options": ["WHEN START", "REPEAT", "MOVE FORWARD", "PLAY SOUND"], "answer": "REPEAT", "explanation": "REPEAT runs the blocks inside it a chosen number of times."},
            {"type": "truefalse", "text": "A sequence means blocks run in order from top to bottom.", "options": ["True", "False"], "answer": "True", "explanation": "Blocks in a sequence run one after another, top to bottom."},
            {"type": "mcq", "text": "What stores a value like score that can change?", "options": ["A loop", "A variable", "A sound", "A sprite"], "answer": "A variable", "explanation": "Variables hold values that change while the program runs."},
            {"type": "code_output", "text": "SET score = 0; REPEAT 3 { CHANGE score by 2 }. What is score?", "options": ["2", "3", "6", "0"], "answer": "6", "explanation": "0 + 2 three times = 6."},
        ],
    },
    "robotics-fundamentals": {
        "title": "Robotics Fundamentals Quiz",
        "questions": [
            {"type": "mcq", "text": "Which sensor measures distance to an obstacle?", "options": ["LED", "Buzzer", "Ultrasonic", "Servo"], "answer": "Ultrasonic", "explanation": "The ultrasonic sensor measures distance using sound waves."},
            {"type": "robotics_logic", "text": "IF distance < 20 the robot should...", "options": ["Move forward faster", "Turn to avoid the obstacle", "Turn off", "Play music"], "answer": "Turn to avoid the obstacle", "explanation": "A close obstacle means the robot should turn away."},
            {"type": "truefalse", "text": "Two motors are needed to make the robot turn.", "options": ["True", "False"], "answer": "True", "explanation": "Running motors at different speeds makes the robot turn."},
        ],
    },
    "game-development": {
        "title": "Game Development Quiz",
        "questions": [
            {"type": "mcq", "text": "What detects when two sprites touch?", "options": ["Collision detection", "A variable", "A loop", "The score"], "answer": "Collision detection", "explanation": "Collision detection checks if sprites overlap."},
            {"type": "truefalse", "text": "The game loop runs many times per second.", "options": ["True", "False"], "answer": "True", "explanation": "The loop updates and redraws the game continuously."},
        ],
    },
    "intro-to-ai": {
        "title": "Introduction to AI Quiz",
        "questions": [
            {"type": "mcq", "text": "How do machines mainly learn in AI?", "options": ["From fixed rules only", "From examples (data)", "By magic", "From the internet cable"], "answer": "From examples (data)", "explanation": "Machine learning learns patterns from data examples."},
            {"type": "truefalse", "text": "A chatbot uses language patterns to reply.", "options": ["True", "False"], "answer": "True", "explanation": "Chatbots use language models trained on lots of text."},
        ],
    },
}

ROBOTICS_CHALLENGES = [
    {"key": "reach-destination", "title": "Reach the Destination", "description": "Program the robot to reach the green target.", "difficulty": "easy"},
    {"key": "avoid-obstacles", "title": "Avoid Obstacles", "description": "Navigate to the goal without hitting red obstacles.", "difficulty": "medium"},
    {"key": "line-following", "title": "Line Following", "description": "Follow the path to the goal using IR sensors.", "difficulty": "medium"},
    {"key": "maze-navigation", "title": "Maze Navigation", "description": "Find your way through the maze to the exit.", "difficulty": "hard"},
    {"key": "automatic-parking", "title": "Automatic Parking", "description": "Park the robot precisely in the marked spot.", "difficulty": "hard"},
    {"key": "object-detection", "title": "Object Detection", "description": "Detect objects with the distance sensor and stop in time.", "difficulty": "medium"},
    {"key": "traffic-signal", "title": "Traffic Signal Robot", "description": "Stop and go based on the traffic signal.", "difficulty": "medium"},
]

GAME_TEMPLATES = [
    {"key": "maze", "title": "Maze Game", "description": "Guide your character to the exit of the maze."},
    {"key": "space-shooter", "title": "Space Shooter", "description": "Shoot incoming asteroids and survive."},
    {"key": "car-racing", "title": "Car Racing", "description": "Dodge traffic and race for a high score."},
    {"key": "catch-object", "title": "Catch the Object", "description": "Catch falling objects before they hit the ground."},
    {"key": "platform", "title": "Platform Game", "description": "Jump across platforms and collect coins."},
]

DEMO_STUDENTS = ["Aarav", "Ananya", "Rahul", "Priya"]
