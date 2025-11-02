{/* Entity class for a Listing in a marketplace application */}
class Listing {
  constructor({ 
    title, description, category, type, price, flatNumber, image, rentalPeriod, delivery, userId, createdAt 
  }) {
    this.title = title;
    this.description = description;
    this.category = category;
    this.type = type;
    this.price = price;
    this.flatNumber = flatNumber;
    this.image = image;
    this.rentalPeriod = rentalPeriod;
    this.delivery = delivery;
    this.userId = userId;
    this.createdAt = createdAt || new Date();
    this.status = 'available';
    this.views = 0;
    this.likes = 0;
  }
}

module.exports = Listing;
