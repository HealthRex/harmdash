# Key Notes
-Project is managed in VSCode and RStudio
-Python venv is stored in this project directory in `.venv`
-Python project is managed with uv and dependencies added with "uv add"
-API keys stored via environment variables: OPENAI_API_KEY, GEMINI_API_KEY, and ANTHROPIC_API_KEY
-Pytest for unit tests. Unit test scripts should NOT require importing the original scripts as modules

-Directory structure:
root/
├── input/
├── output/
├── src/
└── tests/

* `input/`: storage of input data, files, or external resources
* `output/`: storage of results, generated files, or other output
* `src/`: scripts 
* `tests/`: unit tests

All scripts will be named in order of execution (first script should be 01_script, second should be 02_script, etc) when applicable.
For any output that is generated as a result of a script, the output will be saved in a subdirectory of `output` and have the same name as the script (e.g., output of 02_script.py will be stored in output/02_script).

# Overarching Goals
The goals of this project are to 

# Detailed Plan
Python scripts for each of the following tasks:
