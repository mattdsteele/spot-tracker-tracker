sudo docker tag $IMAGE_NAME:latest $ACCOUNT_URL/$IMAGE_NAME:latest
aws ecr get-login-password | sudo docker login --username AWS --password-stdin $ACCOUNT_URL
sudo docker push $ACCOUNT_URL/$IMAGE_NAME