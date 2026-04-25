import XCTest
@testable import AnimalShelter

class ShelterTests: XCTestCase {

    func testAdopt() throws {
        let dog = Dog()
        let shelter = Shelter()
        let result = try shelter.adopt(dog)
        XCTAssertFalse(result.isEmpty)
    }

    func testGuideDog() {
        let dog = GuideDog()
        dog.guide()
        let _ = dog.fetch()
        dog.run()
    }

    func testRescue() throws {
        let cat = Cat()
        let shelter = Shelter()
        try rescue(cat, at: shelter)
    }

}
