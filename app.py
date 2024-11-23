from flask import Flask, request, render_template, jsonify, send_file
import pandas as pd

app = Flask(__name__)

# Load the Excel file as a pandas DataFrame
df = pd.read_excel("colleges.xlsx")  # Adjust the path if needed


@app.route("/")
def index():
    return render_template("form.html")


@app.route("/submit", methods=["POST"])
def submit():
    try:
        mh_cet_percentage = float(request.form["mh-cet-percentage"])
    except ValueError:
        return jsonify({"error": "MH CET Percentage must be a valid number."})

    desired_branches = request.form.getlist("desired-branches")
    college_status = request.form.getlist("college-status")

    # Filter by MH CET Percentage
    filtered_df = df[df["GOPENS MH-CET Percentage"] <= mh_cet_percentage]

    if filtered_df.empty:
        return jsonify({"error": "No colleges found matching the MH CET Percentage."})

    # Filter by Desired Branches if selected
    if desired_branches:
        filtered_df = filtered_df[filtered_df["Branch"].isin(desired_branches)]
        if filtered_df.empty:
            return jsonify(
                {"error": "No colleges found matching the desired branches."}
            )

    # Filter by College Status if selected
    if college_status:
        filtered_df = filtered_df[filtered_df["Status"].isin(college_status)]
        if filtered_df.empty:
            return jsonify({"error": "No colleges found matching the college status."})

    necessary_columns = [
        "College",
        "Branch",
        "GOPENS MH-CET Percentage",
        "Status",
    ]

    filtered_df = filtered_df[necessary_columns]
    tables = filtered_df.to_html(classes="table table-striped", index=False)

    # Return the tables and filtered data
    return jsonify(
        {"tables": tables, "filtered_data": filtered_df.to_dict(orient="records")}
    )


@app.route("/get-colleges", methods=["GET"])
def get_colleges():
    # Load the Excel file if not already loaded or use existing df
    df.fillna(0, inplace=True)
    colleges = df.to_dict(orient="records")  # Convert DataFrame to dictionary
    return jsonify({"colleges": colleges})


@app.route("/results")
def results():
    return render_template("result.html")


if __name__ == "__main__":
    app.run(debug=True)
