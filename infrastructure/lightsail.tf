resource "aws_lightsail_container_service" "pazaak_service" {
  name        = "pazaak-service"
  power       = "nano"
  scale       = 1
  is_disabled = false

  tags = {
    environment = "production"
    project     = "pazaak"
  }
}

