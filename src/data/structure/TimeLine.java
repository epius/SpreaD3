package data.structure;

public class TimeLine {

	private final String startTime;
	private final String endTime;

	public TimeLine(String startTime, String endTime) {

		this.startTime = startTime;
		this.endTime = endTime;

	}// END: Constructor

	public String getStartTime() {
		return startTime;
	}// END: getStartTime

	public String getEndTime() {
		return endTime;
	}// END: getEndTime

}// END: class
