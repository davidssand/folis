import kagglehub

# Download latest version
path = kagglehub.dataset_download("tapakah68/dataset-of-bald-people")

print("Path to dataset files:", path)