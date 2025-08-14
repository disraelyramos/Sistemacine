pipeline {
    agent any

    environment {
        BACKEND_DIR = 'Proyecto-Cine - copia/backend-movieflow'
        FRONTEND_DIR = 'Proyecto-Cine - copia/frontend'
    }

    stages {
        stage('Instalar dependencias Backend') {
            steps {
                dir("${BACKEND_DIR}") {
                    bat 'npm install'
                }
            }
        }

        stage('Instalar dependencias Frontend') {
            steps {
                dir("${FRONTEND_DIR}") {
                    bat 'npm install'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir("${FRONTEND_DIR}") {
                    bat 'npm run build'
                }
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline ejecutado correctamente.'
        }
        failure {
            echo '❌ Error durante la ejecución del pipeline.'
        }
    }
}
