pipeline {
    agent any
    environment {
        GITHUB_CREDS = credentials('github-pat-creds')
    }
    stages {
        stage('Hello') {
            steps {
                echo "Hello World ${GITHUB_CREDS.username}" 
            }
        }
    }
}
