resource "digitalocean_ssh_key" "default" {
  name       = "Terraform Example"
  public_key = file("./pazaak-web-server-key.pub")
}

resource "digitalocean_droplet" "web" {
  image    = "nodejs-20-04"
  name     = "pazaak-web-server"
  region   = "syd1"
  size     = "s-1vcpu-512mb-10gb"
  backups  = false
  ssh_keys = [digitalocean_ssh_key.default.id]
}

resource "aws_route53_record" "web" {
  zone_id = data.aws_route53_zone.androse_pf_zone.zone_id
  name    = "api-pazaak.androse.dev"
  type    = "A"
  ttl     = 300
  records = [digitalocean_droplet.web.ipv4_address]
}


output "droplet_ip" {
  value = digitalocean_droplet.web.ipv4_address
}

