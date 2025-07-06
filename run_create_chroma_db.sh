#!/bin/bash

# Run the script to create and populate the persistent Chroma database

# Activate virtual environment
source .venv/bin/activate

# Use the Python executable from the virtual environment
.venv/bin/python python/create_chroma_db.py 