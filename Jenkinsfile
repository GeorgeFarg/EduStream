pipeline {
    agent any
    environment {
        GITHUB_CREDS = credentials('github-pat-creds')
    }
    stages {
        stage('Hello') {
            steps {
                script {
                    // 1. Echoing the username is safe and visible
                    echo "The bound username is: ${env.BITBUCKET_CREDS_USR}"
                    
                    // 2. Echoing the password directly will output ****
                    echo "The masked password is: ${env.BITBUCKET_CREDS_PSW}"
                }
                
                // 3. To validate without exposing the token, use a conditional shell check
                sh '''
                    if [ -n "$BITBUCKET_CREDS_PSW" ]; then
                        echo "SUCCESS: Password/Token variable is populated and not empty."
                        echo "Token character count: $(echo -n "$BITBUCKET_CREDS_PSW" | wc -c)"
                    else
                        echo "ERROR: Password/Token variable is empty!"
                        exit 1
                    fi
                '''
            }
        }
    }
}
