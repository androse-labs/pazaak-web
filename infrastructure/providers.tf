terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  backend "s3" {
    bucket       = "androse-tfstate"
    key          = "pazaak/terraform.tfstate"
    region       = "us-east-1"
    use_lockfile = true
  }
}


# Configure the AWS Provider
provider "aws" {
  region = "ap-southeast-2"
}

# Alternative provider configuration
provider "aws" {
  region = "us-east-1"
  alias  = "virginia"
}
