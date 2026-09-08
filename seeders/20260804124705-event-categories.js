'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('event_categories', [
      {
        id: uuidv4(),
        name: 'Technology',
        description: 'Tech conferences, hackathons, and software events.',
        created_at: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Business',
        description:
          'Business summits, networking, and entrepreneurship events.',
        created_at: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Education',
        description: 'Workshops, seminars, and educational programs.',
        created_at: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Music',
        description: 'Concerts, live performances, and music festivals.',
        created_at: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Sports',
        description: 'Sports tournaments, marathons, and fitness events.',
        created_at: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Health & Wellness',
        description: 'Yoga, meditation, healthcare, and wellness events.',
        created_at: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Arts & Culture',
        description: 'Art exhibitions, theatre, and cultural festivals.',
        created_at: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Food & Beverage',
        description: 'Food festivals, cooking workshops, and tasting events.',
        created_at: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Fashion',
        description: 'Fashion shows, exhibitions, and designer events.',
        created_at: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Charity',
        description: 'Fundraising, donation drives, and social impact events.',
        created_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('event_categories', null, {});
  },
};
